import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../../api';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Camera, Send, X, AlertTriangle, MapPin, Navigation2,
  Flame, Stethoscope, Car, ShieldAlert, FileText, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = { lat: 10.0000, lng: 122.9000 };

function LocationMarker({ location, setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return location ? <Marker position={[location.lat, location.lng]} /> : null;
}

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function IncidentReportForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Location state
  const [location, setLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [locError, setLocError] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [locationAddress, setLocationAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  // Form state
  const [photos, setPhotos] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Data state
  const [incidentTypes, setIncidentTypes] = useState([]);

  // Emergency types for reference
  const emergencyTypesList = [
    { id: 'FIRE', name: 'Fire' },
    { id: 'MEDICAL_EMERGENCY', name: 'Medical Emergency' },
    { id: 'ACCIDENT', name: 'Accident' },
    { id: 'CRIME-RELATED', name: 'Crime-Related' },
    { id: 'OTHER', name: 'Other' }
  ];

  // Fetch incident types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get('/incident-types');
        setIncidentTypes(res.data);
      } catch (err) {
        console.error('Failed to fetch incident types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Get location on mount
  useEffect(() => {
    const isSecureContext = window.isSecureContext;
    if (isSecureContext && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(coords);
          setMapCenter(coords);
          setGeoLoading(false);
          reverseGeocode(coords);
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  // Reverse geocode
  const reverseGeocode = (loc) => {
    if (!loc) return;
    setAddressLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const barangay = addr.hamlet || addr.neighbourhood || '';
          const city = addr.municipality || addr.city || addr.town || '';
          const displayText = barangay && city ? `Barangay ${barangay}, ${city}` : locationAddress || 'Unknown location';
          setLocationAddress(displayText);
        }
        setAddressLoading(false);
      })
      .catch(() => {
        setLocationAddress('Could not resolve address');
        setAddressLoading(false);
      });
  };

  const handleRefreshLocation = () => {
    if (!('geolocation' in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setMapCenter(coords);
        setLocError('');
        setGeoLoading(false);
        reverseGeocode(coords);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setLocError('Could not detect location. Permission denied or unavailable.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const handlePhotoChange = (e) => {
    if (e.target.files) {
      const newPhotos = [...photos, ...Array.from(e.target.files)].slice(0, 5);
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error('Please detect your location');
      return;
    }
    if (!selectedType) {
      toast.error('Please select an emergency type');
      return;
    }
    if (!description.trim()) {
      toast.error('Please describe the incident');
      return;
    }

    // Find type ID from incident types
    const typeId = incidentTypes.find(t => t.name === selectedType)?.type_id;
    if (!typeId) {
      toast.error('Incident type not found');
      return;
    }

    setLoading(true);
    try {
      // Create incident
      const incRes = await incidentAPI.create({
        incident_type_id: typeId,
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lng,
        map_pin_address: locationAddress,
        severity: severity,
        reporter_name: fullName || undefined,
        reporter_contact: contactNumber || undefined
      });

      const incidentId = incRes.data?.incident_id;

      // Upload photos if any
      if (incidentId && photos.length > 0) {
        for (const photo of photos) {
          try {
            const formData = new FormData();
            formData.append('file', photo);
            formData.append('incident_id', incidentId);
            await api.post('/evidence', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (evErr) {
            console.error('Evidence upload failed:', evErr);
          }
        }
      }

      toast.success('Incident reported successfully!');
      navigate('/reporter/report/success');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit emergency report');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 pt-safe">
        <div className="flex items-center h-16 px-4 max-w-[430px] mx-auto">
          <button
            onClick={() => navigate('/reporter/home')}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center -ml-10 pointer-events-none">
            <h1 className="text-lg font-bold text-slate-900">Emergency Report</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Complete Form</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[430px] mx-auto w-full p-5 flex flex-col overflow-y-auto">

        {/* Location Error Banner */}
        {locError && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 font-medium">{locError}</p>
          </div>
        )}

        {/* PHOTO EVIDENCE SECTION - TOP */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0 mx-auto mb-3">
              <Camera size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Photo Evidence</h3>
            <p className="text-xs text-slate-400 mt-1">(Optional but recommended)</p>
          </div>

          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100/50 transition-colors relative overflow-hidden">
            <Camera size={32} className="text-blue-400 mb-2" />
            <p className="text-sm font-bold text-blue-700 text-center">Click to take or upload photo</p>
            <p className="text-xs text-blue-500 mt-1">(Optional but recommended)</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              disabled={photos.length >= 5}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur rounded-full text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">{photos.length}/5 photos attached</p>
          )}
        </div>

        {/* YOUR LOCATION SECTION */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <MapPin size={16} className="text-green-500" /> Your Location
            </h3>
            <button
              onClick={handleRefreshLocation}
              disabled={geoLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={geoLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Mini Map */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden mb-3">
            <div className="h-[200px] w-full rounded-xl overflow-hidden bg-slate-100 z-0 relative">
              {geoLoading && !location ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mb-2"></div>
                  <p className="text-xs font-medium text-slate-600">Acquiring GPS...</p>
                </div>
              ) : (
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={location ? 16 : 13}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker location={location} setLocation={(loc) => {
                    setLocation(loc);
                    setLocError('');
                    reverseGeocode(loc);
                  }} />
                </MapContainer>
              )}
              {location && (
                <button
                  onClick={handleRefreshLocation}
                  title="Use my current location"
                  className="absolute bottom-4 right-4 z-[400] w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Navigation2 size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Your Location</span>
                  {location && <span className="text-xs font-bold text-green-600">✓ DETECTED</span>}
                </div>
                {addressLoading ? (
                  <p className="text-sm text-slate-400">Resolving address...</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-800">{locationAddress || 'Default location (using fallback)'}</p>
                    {location && (
                      <p className="text-xs text-slate-400 mt-1">{location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EMERGENCY TYPE SECTION */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Emergency Type <span className="text-red-500">*</span>
          </h3>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px'
            }}
          >
            <option value="">-- Select Emergency Type --</option>
            {emergencyTypesList.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION SECTION */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Description <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-slate-400">{description.length}/500</span>
          </div>
          <textarea
            rows="4"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, any injuries, hazards, or specific landmarks..."
            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm resize-none transition-all"
          ></textarea>
        </div>

        {/* INCIDENT SEVERITY */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Incident Severity
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
              <button
                key={level}
                onClick={() => setSeverity(level)}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${
                  severity === level
                    ? level === 'CRITICAL' ? 'bg-red-500 text-white border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                      : level === 'HIGH' ? 'bg-orange-500 text-white border-orange-500 shadow-[0_4px_12px_rgba(249,115,22,0.3)]'
                      : level === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* OPTIONAL PERSONAL INFO */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">Optional Personal Info</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
            <input
              type="tel"
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

      </div>

      {/* Sticky Bottom */}
      <div className="p-5 bg-white border-t border-slate-200 pb-8 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-[430px] mx-auto space-y-3">
          <button
            onClick={handleSubmit}
            disabled={loading || !location || !selectedType || !description.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              !loading && location && selectedType && description.trim()
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending Report...
              </>
            ) : (
              <>
                <Send size={18} className="-ml-1" />
                Submit Emergency Report
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
            <AlertTriangle size={12} /> False reporting is punishable by law
          </p>
        </div>
      </div>
    </div>
  );
}
