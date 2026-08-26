import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Clock, Shield, Camera, Info, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function ReportDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { incident } = route.params;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-PH', { 
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    const map = {
      REPORTED: { bg: '#FEF3C7', text: '#B45309', label: 'Awaiting Verification' },
      VERIFIED: { bg: '#DBEAFE', text: '#1E40AF', label: 'Verified & Active' },
      RESPONDING: { bg: '#E0E7FF', text: '#3730A3', label: 'Response Dispatched' },
      ON_SCENE: { bg: '#F3E8FF', text: '#6B21A8', label: 'Units On Scene' },
      RESOLVED: { bg: '#D1FAE5', text: '#065F46', label: 'Successfully Resolved' },
      FALSE_ALARM: { bg: '#FEE2E2', text: '#991B1B', label: 'False Alarm' },
      CLOSED: { bg: '#F1F5F9', text: '#475569', label: 'Case Closed' },
    };
    return map[status] || map.REPORTED;
  };

  const statusInfo = getStatusColor(incident.status);
  const postReport = incident.post_report;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={Colors.slate700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusLabel, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.incidentCode}>{incident.incident_code}</Text>
          <Text style={styles.reportedAt}>Reported {formatDate(incident.reported_at)}</Text>
        </View>

        {/* Section: Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={18} color={Colors.slate400} />
            <Text style={styles.sectionTitle}>INFORMATION</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>TYPE</Text>
              <Text style={styles.infoValue}>{incident.incident_type?.name || 'Emergency'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SEVERITY</Text>
              <Text style={[styles.infoValue, { color: incident.severity === 'CRITICAL' ? Colors.rose : Colors.amber }]}>{incident.severity}</Text>
            </View>
          </View>
          <View style={styles.addressBox}>
            <MapPin size={16} color={Colors.slate400} />
            <Text style={styles.addressText}>{incident.map_pin_address || incident.barangay?.name || 'Locating...'}</Text>
          </View>
          {incident.landmark ? (
            <View style={[styles.addressBox, { borderTopWidth: 0, paddingTop: 0 }]}>
              <MapPin size={16} color={Colors.indigo || '#4F46E5'} />
              <Text style={[styles.addressText, { fontWeight: '700', color: Colors.slate800 }]}>Near Landmark: {incident.landmark}</Text>
            </View>
          ) : null}
          <Text style={styles.description}>"{incident.description}"</Text>
        </View>

        {/* Section: Resolution Proof (THE NEW STUFF) */}
        {incident.status === 'RESOLVED' && postReport && (
          <View style={[styles.section, styles.resolutionSection]}>
            <View style={styles.sectionHeader}>
              <CheckCircle2 size={18} color={Colors.emerald} />
              <Text style={[styles.sectionTitle, { color: Colors.emerald }]}>RESOLUTION PROOF</Text>
            </View>
            
            <View style={styles.resolutionDetails}>
              <View style={styles.resRow}>
                <Shield size={14} color={Colors.slate500} />
                <Text style={styles.resLabel}>Resolved by:</Text>
                <Text style={styles.resValue}>{postReport.submitter?.name || 'Emergency Unit'}</Text>
              </View>
              <View style={styles.resRow}>
                <Clock size={14} color={Colors.slate500} />
                <Text style={styles.resLabel}>Response Time:</Text>
                <Text style={styles.resValue}>{postReport.response_time_minutes} mins</Text>
              </View>
            </View>

            <Text style={styles.actionsTaken}>"{postReport.actions_taken}"</Text>
            
            {postReport.photos && postReport.photos.length > 0 && (
              <View style={styles.photoGrid}>
                {postReport.photos.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.proofPhoto} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Section: Your Evidence */}
        {incident.evidence && incident.evidence.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Camera size={18} color={Colors.slate400} />
              <Text style={styles.sectionTitle}>YOUR EVIDENCE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {incident.evidence.map((ev, i) => (
                <View key={i} style={styles.evidenceWrap}>
                  <Image source={{ uri: ev.file_path }} style={styles.evidenceImg} />
                  <Text style={styles.evidenceDate}>{formatDate(ev.uploaded_at)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* False Alarm Section */}
        {incident.status === 'FALSE_ALARM' && (
           <View style={[styles.section, { borderColor: Colors.roseLight, backgroundColor: '#FFF5F5' }]}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={18} color={Colors.rose} />
              <Text style={[styles.sectionTitle, { color: Colors.rose }]}>FALSE ALARM</Text>
            </View>
            <Text style={styles.falseAlarmText}>
              This report was marked as a false alarm after investigation or admin review. 
              If you believe this is an error, please contact dispatch.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, height: 64, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.slate100 
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.slate900, letterSpacing: -0.5 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  
  statusCard: { 
    alignItems: 'center', marginBottom: 32, padding: 24, 
    backgroundColor: Colors.slate50, borderRadius: BorderRadius.xxl, borderWidth: 1, borderColor: Colors.slate200 
  },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, marginBottom: 16 },
  statusLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  incidentCode: { fontSize: 24, fontWeight: '900', color: Colors.slate900, marginBottom: 4 },
  reportedAt: { fontSize: 13, color: Colors.slate500, fontWeight: '600' },
  
  section: { marginBottom: 32, padding: 20, borderRadius: BorderRadius.xxl, borderWidth: 1, borderColor: Colors.slate100 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Colors.slate500, letterSpacing: 1.5 },
  
  infoRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: Colors.slate400, marginBottom: 4, letterSpacing: 1 },
  infoValue: { fontSize: 15, fontWeight: '700', color: Colors.slate800 },
  
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.slate50, marginBottom: 16 },
  addressText: { fontSize: 14, color: Colors.slate600, fontWeight: '500', flex: 1 },
  description: { fontSize: 15, color: Colors.slate700, lineHeight: 22, fontStyle: 'italic', fontWeight: '500' },
  
  resolutionSection: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  resolutionDetails: { gap: 8, marginBottom: 16 },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resLabel: { fontSize: 12, color: Colors.slate500, fontWeight: '600' },
  resValue: { fontSize: 12, color: Colors.slate800, fontWeight: '800' },
  actionsTaken: { fontSize: 14, color: Colors.slate700, fontWeight: '600', lineHeight: 20, backgroundColor: Colors.white, padding: 16, borderRadius: BorderRadius.xl, marginBottom: 16 },
  
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  proofPhoto: { width: (width - 120) / 3, height: (width - 120) / 3, borderRadius: BorderRadius.lg, backgroundColor: Colors.slate200 },
  
  horizontalScroll: { marginTop: 8 },
  evidenceWrap: { marginRight: 12, width: 140 },
  evidenceImg: { width: 140, height: 180, borderRadius: BorderRadius.xl, backgroundColor: Colors.slate200 },
  evidenceDate: { fontSize: 10, color: Colors.slate400, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  
  falseAlarmText: { fontSize: 14, color: Colors.rose, fontWeight: '600', lineHeight: 20 },
});
