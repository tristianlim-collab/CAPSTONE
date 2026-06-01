import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, Image, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import {
  ArrowLeft, Camera, Send, X, AlertTriangle, MapPin, Navigation,
  Flame, Stethoscope, Car, FileText, RefreshCw, ChevronDown, Navigation2
} from 'lucide-react-native';
import api, { incidentAPI } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme/colors';

const EMERGENCY_TYPES = [
  { id: 'Fire', name: 'Fire', Icon: Flame, color: Colors.orange, bg: Colors.orangeLight },
  { id: 'Medical Emergency', name: 'Medical Emergency', Icon: Stethoscope, color: '#E11D48', bg: '#FFF1F2' },
  { id: 'Accident', name: 'Accident', Icon: Car, color: Colors.primaryDark, bg: Colors.primaryFaint },
  { id: 'Crime', name: 'Crime-Related', Icon: AlertTriangle, color: '#D97706', bg: Colors.amberLight },
  { id: 'Other', name: 'Other', Icon: FileText, color: Colors.slate600, bg: Colors.slate100 },
];

const SEVERITIES = ['LOW', 'HIGH', 'CRITICAL'];
const SEV_COLORS = {
  LOW: { bg: Colors.emerald, shadow: 'rgba(16,185,129,0.3)' },
  HIGH: { bg: Colors.orange, shadow: 'rgba(249,115,22,0.3)' },
  CRITICAL: { bg: '#EF4444', shadow: 'rgba(239,68,68,0.3)' },
};
const SEV_DESC = {
  LOW: 'Localized issue with limited impact.',
  HIGH: 'Serious incident requiring urgent coordinated response.',
  CRITICAL: 'Extreme emergency with immediate widespread risk.',
};

const STATIC_LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; background-color: #000; }
    #map { height: 100vh; width: 100vw; }
    .pulse-marker {
      background: #3B82F6;
      border-radius: 50%;
      height: 14px;
      width: 14px;
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      animation: pulse 1.5s infinite;
      border: 3px solid white;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    .leaflet-control-attribution { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { 
      zoomControl: false,
      zoomAnimation: true
    }).setView([10.74, 122.96], 13);
    
    L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google'
    }).addTo(map);
    
    var marker = null;
    var accCircle = null;
    
    window.updateMapLocation = function(lat, lng, acc) {
      if (!marker) {
        var pulseIcon = L.divIcon({ className: 'pulse-marker', iconSize: [14, 14], iconAnchor: [7, 7] });
        marker = L.marker([lat, lng], { icon: pulseIcon, draggable: true }).addTo(map);
        if (acc) accCircle = L.circle([lat, lng], { radius: acc, color: '#3B82F6', fillOpacity: 0.1, weight: 1 }).addTo(map);
        
        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          if (accCircle) accCircle.setLatLng(pos);
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat, lng: pos.lng }));
        });
      } else {
        marker.setLatLng([lat, lng]);
        if (accCircle) {
           accCircle.setLatLng([lat, lng]);
           if (acc) accCircle.setRadius(acc);
        }
      }
      map.setView([lat, lng], 17, { animate: true });
    };

    map.on('click', function(e) {
      if (marker) {
        marker.setLatLng(e.latlng);
        if (accCircle) accCircle.setLatLng(e.latlng);
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
      }
    });
  </script>
</body>
</html>
`;

export default function IncidentReportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [locationAddress, setLocationAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('+63');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/incident-types');
        setIncidentTypes(res.data);
      } catch (e) { console.error('Failed to fetch types:', e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setGeoLoading(false); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(coords);
        setGeoLoading(false);
        reverseGeocode(coords);
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(`window.updateMapLocation(${coords.lat}, ${coords.lng}, ${loc.coords.accuracy || 0}); true;`);
        }, 500); // Give WebView time to load
      } catch (e) {
        console.warn('Location failed:', e);
        setGeoLoading(false);
      }
    })();
  }, []);

  const reverseGeocode = async (loc) => {
    if (!loc) return;
    setAddressLoading(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en',
            'User-Agent': 'GAOIRS-ReporterApp/1.0',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      const data = await resp.json();

      if (data?.address) {
        const addr = data.address;

        // Local address components
        const road = addr.road || addr.street || '';
        const village = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || '';
        const city = addr.city || addr.town || addr.municipality || '';
        const province = addr.province || addr.state || addr.county || '';

        const parts = [];

        // 1. Street Name
        if (road) parts.push(road);

        // 2. Barangay (Village) - avoid duplicates
        if (village && !road.toLowerCase().includes(village.toLowerCase())) {
          parts.push(village.toLowerCase().includes('barangay') ? village : `Brgy. ${village}`);
        }

        // 3. City/Town
        if (city && !village.toLowerCase().includes(city.toLowerCase())) {
          parts.push(city);
        }

        // 4. Province
        if (province && province !== city) {
          parts.push(province);
        }

        if (parts.length > 0) {
          // Filter out redundant names like "McKinley Baybay" if it's not the primary village/road
          let cleanParts = parts.filter((v, i, a) => a.indexOf(v) === i);

          // Fix for specific user report about McKinley Baybay
          cleanParts = cleanParts.filter(p => !p.toLowerCase().includes('mckinley baybay'));

          setLocationAddress(cleanParts.join(', '));
        } else if (data.display_name) {
          setLocationAddress(data.display_name.split(',').slice(0, 4).join(','));
        } else {
          setLocationAddress(`${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`);
        }
      } else if (data?.display_name) {
        setLocationAddress(data.display_name.split(',').slice(0, 4).join(','));
      } else {
        setLocationAddress(`${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`);
      }
    } catch {
      setLocationAddress(`${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`);
    } finally { setAddressLoading(false); }
  };

  const handleRefreshLocation = async () => {
    setGeoLoading(true);
    try {
      // Use Highest accuracy to get the most precise GPS fix possible
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);
      reverseGeocode(coords);
      webViewRef.current?.injectJavaScript(`window.updateMapLocation(${coords.lat}, ${coords.lng}, ${loc.coords.accuracy || 0}); true;`);
    } catch (e) {
      Alert.alert('Location Error', 'Could not detect location.');
    } finally { setGeoLoading(false); }
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const handleTakePhoto = async () => {
    if (photos.length >= 5) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission required.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const handlePhotoSelect = () => {
    Alert.alert(
      "Photo Evidence",
      "Choose an option",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
      ]
    );
  };

  const isValidPhone = /^\+639\d{9}$/.test(contactNumber);

  const getSeverityDescription = () => {
    const selectedTypeData = incidentTypes.find(t => t.name?.toLowerCase() === selectedType?.toLowerCase());
    if (selectedTypeData?.description) {
      try {
        const parsed = JSON.parse(selectedTypeData.description);
        const configured = parsed?.severityDescriptions?.[severity];
        if (configured) return configured;
      } catch {
        // Fallback to default
      }
    }
    return SEV_DESC[severity];
  };

  const generatedDescription = selectedType
    ? `${selectedType} - ${severity}: ${getSeverityDescription()}`
    : '';

  const handleSubmit = async () => {
    if (!location) { Alert.alert('Error', 'Please detect your location'); return; }
    if (!selectedType) { Alert.alert('Error', 'Please select an emergency type'); return; }
    if (photos.length === 0) { Alert.alert('Error', 'Please attach at least 1 photo as evidence'); return; }

    let types = incidentTypes;
    if (!types.length) {
      try {
        const res = await api.get('/incident-types');
        types = res.data || [];
        setIncidentTypes(types);
      } catch { Alert.alert('Error', 'Could not load incident types.'); return; }
    }
    const typeId = types.find(t => t.name?.toLowerCase() === selectedType?.toLowerCase())?.type_id;
    if (!typeId) { Alert.alert('Error', 'Incident type not found.'); return; }
    if (!isValidPhone) { setPhoneTouched(true); Alert.alert('Error', 'Use format +639XXXXXXXXX.'); return; }

    setLoading(true);
    try {
      const incRes = await incidentAPI.create({
        incident_type_id: typeId,
        description: generatedDescription,
        latitude: location.lat,
        longitude: location.lng,
        map_pin_address: locationAddress,
        severity,
        reporter_name: fullName || undefined,
        reporter_phone: contactNumber,
      });
      const incidentId = incRes.data?.incident_id;
      if (incidentId && photos.length > 0) {
        for (const photo of photos) {
          try {
            const formData = new FormData();
            formData.append('file', {
              uri: photo.uri,
              type: 'image/jpeg',
              name: `evidence_${Date.now()}.jpg`,
            });
            formData.append('incident_id', incidentId);
            await api.post('/evidence', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (e) { console.error('Evidence upload failed:', e); }
        }
      }
      navigation.replace('ReportSuccess');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit report');
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Emergency Report</Text>
            <Text style={styles.headerSub}>COMPLETE FORM</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {/* Photo Evidence */}
        <View style={styles.section}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={styles.photoIconCircle}>
              <Camera size={24} color="#3B82F6" />
            </View>
            <Text style={styles.sectionLabel}>PHOTO EVIDENCE</Text>

          </View>
          <TouchableOpacity style={styles.dashedUploadBox} onPress={handlePhotoSelect} activeOpacity={0.7}>
            <Camera size={32} color="#60A5FA" style={{ marginBottom: 8 }} />
            <Text style={styles.uploadBoxTitle}>Click to take a photo</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((p, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}>
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {photos.length > 0 && <Text style={styles.photoCount}>{photos.length}/5 photos attached</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}><MapPin size={16} color="#22C55E" /> YOUR LOCATION</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={handleRefreshLocation} disabled={geoLoading}>
              <RefreshCw size={12} color="#16A34A" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Mini Map */}
          <View style={styles.mapCard}>
            <WebView
              ref={webViewRef}
              source={{ html: STATIC_LEAFLET_HTML }}
              style={styles.mapView}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              onMessage={(event) => {
                try {
                  const coords = JSON.parse(event.nativeEvent.data);
                  setLocation(coords);
                  reverseGeocode(coords);
                } catch (e) { }
              }}
            />
            {geoLoading && !location && (
              <View style={[StyleSheet.absoluteFill, styles.mapPlaceholder]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 8, color: '#475569', fontWeight: '500', fontSize: 12 }}>Acquiring GPS...</Text>
              </View>
            )}
            {location && (
              <TouchableOpacity
                style={styles.floatingNavBtn}
                onPress={handleRefreshLocation}
                activeOpacity={0.8}
              >
                <Navigation2 size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Status */}
          <View style={styles.locationCard}>
            <MapPin size={16} color="#16A34A" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={styles.locationLabel}>YOUR LOCATION</Text>
                <Text style={styles.locationDetectedLabel}>{location ? '✓ DETECTED' : 'DETECTING...'}</Text>
              </View>
              {geoLoading ? (
                <ActivityIndicator size="small" color="#94A3B8" style={{ alignSelf: 'flex-start' }} />
              ) : addressLoading ? (
                <Text style={styles.locationAddr}>Resolving address...</Text>
              ) : (
                <>
                  <Text style={styles.locationAddr}>{locationAddress || 'Tap the map to select location'}</Text>
                  {location && (
                    <Text style={styles.locationCoords}>📌 GPS: {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°</Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 12 }]}><AlertTriangle size={16} color="#F97316" /> EMERGENCY TYPE <Text style={{ color: '#EF4444' }}>*</Text></Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => setSelectedType(itemValue)}
              style={styles.picker}
              dropdownIconColor="#475569"
            >
              <Picker.Item label="-- Select Emergency Type --" value="" color="#94A3B8" />
              {EMERGENCY_TYPES.map(type => (
                <Picker.Item key={type.id} label={type.name} value={type.id} color="#1E293B" />
              ))}
            </Picker>
          </View>
        </View>

        {/* Severity */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 12 }]}><AlertTriangle size={16} color="#F97316" /> INCIDENT SEVERITY</Text>
          <View style={styles.sevRow}>
            {SEVERITIES.map((level) => {
              const sel = severity === level;
              const c = SEV_COLORS[level];
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.sevBtn, sel && { backgroundColor: c.bg, borderColor: c.bg }]}
                  onPress={() => setSeverity(level)}
                >
                  <Text style={[styles.sevText, sel && { color: '#FFFFFF' }]}>{level}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.descBox}>
            <Text style={styles.descText}>{getSeverityDescription()}</Text>
          </View>
          {generatedDescription ? (
            <View style={styles.autoDescBox}>
              <Text style={styles.autoDescText}>
                <Text style={{ fontWeight: '600' }}>Description: </Text>
                {generatedDescription}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>PERSONAL INFO</Text>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#94A3B8"
            value={fullName} onChangeText={setFullName} />
          <TextInput
            style={[styles.input, phoneTouched && !isValidPhone && { borderColor: '#EF4444' }]}
            placeholder="+639XXXXXXXXX"
            placeholderTextColor="#94A3B8"
            value={contactNumber}
            keyboardType="phone-pad"
            maxLength={13}
            onBlur={() => setPhoneTouched(true)}
            onChangeText={(v) => {
              const d = v.replace(/\D/g, '');
              let n = d; if (n.startsWith('63')) n = n.slice(2); else if (n.startsWith('0')) n = n.slice(1);
              setContactNumber(`+63${n.slice(0, 10)}`);
            }}
          />
          {phoneTouched && !isValidPhone && (
            <Text style={{ color: '#EF4444', fontSize: 11, marginTop: -8, marginBottom: 8 }}>Use +639XXXXXXXXX</Text>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Submit */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={{ maxWidth: 430, alignSelf: 'center', width: '100%' }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !location || !selectedType}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={(!loading && location && selectedType) ? ['#DC2626', '#EF4444'] : ['#F1F5F9', '#F1F5F9']}
              style={styles.submitBtn}
            >
              {loading ? (
                <><ActivityIndicator color="#FFFFFF" size="small" /><Text style={styles.submitText}> Sending...</Text></>
              ) : (
                <><Send size={18} color={(!location || !selectedType) ? '#94A3B8' : '#FFFFFF'} /><Text style={[styles.submitText, (!location || !selectedType) && { color: '#94A3B8' }]}> Submit Emergency Report</Text></>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 }}>
            <AlertTriangle size={12} color="#94A3B8" />
            <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>False reporting is punishable by law</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerCenter: { flex: 1, alignItems: 'center', position: 'absolute', left: 0, right: 0 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginTop: 2 },
  form: { padding: 20, paddingBottom: 40, maxWidth: 430, alignSelf: 'center', width: '100%' },
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', letterSpacing: 0.5 },
  photoIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  optionalTag: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  dashedUploadBox: { backgroundColor: '#EFF6FF', borderWidth: 2, borderStyle: 'dashed', borderColor: '#BFDBFE', borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' },
  uploadBoxTitle: { fontSize: 14, fontWeight: '700', color: '#1D4ED8', textAlign: 'center' },
  uploadBoxSub: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  photoThumb: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  photoCount: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0FDF4' },
  refreshText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  mapCard: { width: '100%', height: 350, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  mapView: { width: '100%', height: '100%', backgroundColor: 'transparent' },
  mapPlaceholder: { backgroundColor: 'rgba(241, 245, 249, 0.9)', alignItems: 'center', justifyContent: 'center' },
  floatingNavBtn: { position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  locationCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  locationLabel: { fontSize: 12, fontWeight: '700', color: '#15803D', letterSpacing: 0.5 },
  locationDetectedLabel: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  locationAddr: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  locationCoords: { fontSize: 12, color: '#64748B' },
  pickerContainer: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  picker: { height: 50, width: '100%', color: '#1E293B' },
  sevRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sevBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center' },
  sevText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  descBox: { marginTop: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  descText: { fontSize: 12, color: '#64748B' },
  autoDescBox: { marginTop: 8, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  autoDescText: { fontSize: 12, color: '#475569' },
  input: { width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', fontSize: 14, color: '#1E293B', marginBottom: 12 },
  stickyBottom: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 40, elevation: 10 },
  submitBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});
