import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, MapPin, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { incidentAPI } from '../api';
import { useSocketContext } from '../context/SocketContext';
import { Colors, FontSizes, BorderRadius } from '../theme/colors';

export default function MyReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { on } = useSocketContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      // Load incident IDs saved on this device when reports were submitted
      const stored = await AsyncStorage.getItem('my_report_ids');
      const ids = stored ? JSON.parse(stored) : [];
      if (ids.length === 0) { setReports([]); return; }
      // Fetch each report by its ID (includes all statuses — REPORTED to RESOLVED)
      const results = await Promise.allSettled(ids.map(id => incidentAPI.getById(id)));
      const fetched = results
        .filter(r => r.status === 'fulfilled' && r.value?.data)
        .map(r => r.value.data);
      setReports(fetched);
    } catch (e) {
      console.error('Fetch reports failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Real-time status sync via socket
  useEffect(() => {
    const u1 = on('incident_status_updated', (data) => {
      setReports(prev => prev.map(r => r.incident_id === data.incident_id ? { ...r, status: data.status, ...(data.incident || {}) } : r));
    });
    const u2 = on('incident_verified', (data) => {
      const inc = data.incident || data;
      setReports(prev => prev.map(r => r.incident_id === inc.incident_id ? { ...r, status: 'VERIFIED', ...inc } : r));
    });
    const u3 = on('incident_deleted', (data) => {
      setReports(prev => prev.filter(r => r.incident_id !== data.incident_id));
    });
    return () => { u1(); u2(); u3(); };
  }, [on]);

  const getStatusStyle = (status) => {
    const map = {
      REPORTED: { bg: '#FEF3C7', text: '#B45309', label: '⏳ Awaiting Review' },
      VERIFIED: { bg: Colors.primaryLight, text: Colors.primaryDark, label: '✓ Verified' },
      RESPONDING: { bg: Colors.indigoLight, text: Colors.indigo, label: '🚗 Responding' },
      ON_SCENE: { bg: '#F3E8FF', text: '#7C3AED', label: '📍 On Scene' },
      RESOLVED: { bg: Colors.emeraldLight, text: Colors.emerald, label: '✓ Resolved' },
      FALSE_ALARM: { bg: '#FEE2E2', text: '#DC2626', label: '✗ False Alarm' },
      CLOSED: { bg: Colors.slate100, text: Colors.slate600, label: '📋 Closed' },
    };
    return map[status] || map.REPORTED;
  };

  const formatDate = (d) => {
    if (!d) return 'Unknown';
    return new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={Colors.slate600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyWrap}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading your reports...</Text></View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><FileText size={24} color={Colors.slate400} /></View>
            <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
          </View>
        ) : (
          reports.map(report => {
            const s = getStatusStyle(report.status);
            return (
              <TouchableOpacity 
                key={report.incident_id} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReportDetails', { incident: report })}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <View style={styles.cardIcon}><FileText size={20} color={Colors.primaryDark} /></View>
                    <View>
                      <Text style={styles.cardType}>{report.incident_type?.name || 'Incident'}</Text>
                      <Text style={styles.cardCode}>{report.incident_code}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                  </View>
                </View>
                {report.description && <Text style={styles.cardDesc} numberOfLines={2}>{report.description}</Text>}
                {report.landmark && (
                  <View style={{ marginTop: 8, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MapPin size={12} color="#2563EB" />
                    <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '500' }}>Landmark: <Text style={{ fontWeight: '700' }}>{report.landmark}</Text></Text>
                  </View>
                )}
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}><Clock size={14} color={Colors.slate500} /><Text style={styles.metaText}>{formatDate(report.reported_at)}</Text></View>
                  <View style={styles.metaItem}><MapPin size={14} color={Colors.slate500} /><Text style={styles.metaText} numberOfLines={1}>{report.map_pin_address || 'Unknown'}</Text></View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.slate200 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.slate800 },
  listContent: { padding: 20 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { fontSize: 14, color: Colors.slate500, marginTop: 12 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.slate200 },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.slate100, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.slate500 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)', shadowColor: Colors.black, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  cardType: { fontSize: 15, fontWeight: '600', color: Colors.slate800 },
  cardCode: { fontSize: 11, color: Colors.slate500, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: Colors.slate600, marginTop: 10, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.slate100 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaText: { fontSize: 12, color: Colors.slate500 },
});
