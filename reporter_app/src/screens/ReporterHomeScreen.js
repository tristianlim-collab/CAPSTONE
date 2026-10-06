import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, Dimensions, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home, FileText, ChevronRight,
  MapPin, Clock, AlertTriangle, ShieldCheck,
  Flame, Activity, Stethoscope, Car, LogOut
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { incidentAPI } from '../api';

const TYPE_ICONS = {
  'FIRE': Flame,
  'FLOOD': AlertTriangle,
  'LANDSLIDE': AlertTriangle,
  'MEDICAL': Stethoscope,
  'ACCIDENT': Car,
  'INFRASTRUCTURE': FileText,
};

export default function ReporterHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { on, connected } = useSocketContext();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const { logout } = useAuth();

  const handleExit = () => {
    if (logout) logout();
    navigation.replace('Login');
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const stored = await AsyncStorage.getItem('my_report_ids');
        let ids = stored ? JSON.parse(stored) : [];

        if (ids.length > 0) {
          const results = await Promise.allSettled(ids.map(id => incidentAPI.getById(id)));
          const fetched = results
            .filter(r => r.status === 'fulfilled' && (r.value?.data?.data || r.value?.data))
            .map(r => r.value.data?.data || r.value.data);
          setIncidents(fetched);
        } else {
          setIncidents([]);
        }
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (err) {
        console.warn('Location permission check failed:', err);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub1 = on('incident_status_updated', (data) => {
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id
          ? { ...inc, status: data.status, ...(data.incident || {}) }
          : inc
      ));
    });
    const unsub1b = on('incident_verified', (data) => {
      const incId = data.incident_id || data.incident?.incident_id;
      const newStatus = data.status || 'RESPONDING';
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === incId ? { ...inc, status: newStatus, ...(data.incident || {}) } : inc
      ));
    });
    const unsub1c = on('incident_approved', (data) => {
      const incId = data.incident_id || data.incident?.incident_id;
      const newStatus = data.status || 'RESPONDING';
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === incId ? { ...inc, status: newStatus, ...(data.incident || {}) } : inc
      ));
    });
    const unsub2 = on('incident_updated', (data) => {
      setIncidents(prev => prev.map(inc =>
        inc.incident_id === data.incident_id ? { ...inc, ...data } : inc
      ));
    });
    const unsub3 = on('new_incident', (incident) => {
      setIncidents(prev => {
        if (prev.find(i => i.incident_id === incident.incident_id)) return prev;
        return [incident, ...prev];
      });
    });
    const unsub4 = on('incident_deleted', (data) => {
      setIncidents(prev => prev.filter(inc => inc.incident_id !== data.incident_id));
    });
    const unsub5 = on('incident_resolved', (data) => {
      Alert.alert(
        'Incident Resolved ✅',
        data.message || `Your reported incident #${data.incident_code} has been resolved by the response team.`,
        [{ text: 'OK' }]
      );
      // Refresh list
      setIncidents(prev => prev.map(inc => 
        inc.incident_id === data.incident_id ? { ...inc, status: 'RESOLVED' } : inc
      ));
    });
    return () => { unsub1(); unsub1b(); unsub1c(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [on]);


  const totalReports = incidents.length;
  const activeCount = incidents.filter(i => ['REPORTED', 'VERIFIED', 'RESPONDING'].includes(i.status)).length;
  const recentIncidents = incidents.slice(0, 5);

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status) => {
    const map = {
      REPORTED: { label: 'Reported', bg: Colors.amberLight, text: '#D97706' },
      VERIFIED: { label: 'Verified', bg: Colors.primaryLight, text: Colors.primaryDark },
      RESPONDING: { label: 'Responding', bg: Colors.indigoLight, text: Colors.indigo },
      RESOLVED: { label: 'Resolved', bg: Colors.emeraldLight, text: Colors.emerald },
      CLOSED: { label: 'Closed', bg: Colors.slate100, text: Colors.slate600 },
    };
    return map[status] || map.REPORTED;
  };

  const getTypeIcon = (incident) => {
    if (!incident) return FileText;
    const typeName = (incident.incident_type?.name || incident.type?.name || '').toUpperCase();
    for (const [key, Icon] of Object.entries(TYPE_ICONS)) {
      if (typeName.includes(key)) return Icon;
    }
    return FileText;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Dark Curved Header Background */}
      <View style={[styles.headerBg, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Citizen'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={handleExit}>
            <LogOut size={14} color="#FFFFFF" />
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Big Emergency Report Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('IncidentReport')}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emergencyBtn}
          >
            <View style={styles.emergencyIconCircle}>
              <AlertTriangle size={36} color={Colors.white} />
            </View>
            <Text style={styles.emergencyTitle}>Emergency Report</Text>
            <View style={styles.emergencySubRow}>
              <Text style={styles.emergencySub}>Tap to request immediate assistance</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Status Tracking Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY REPORT STATUS TRACKING</Text>
        </View>

        {/* Recent Incidents List with 4-Step Tracker */}
        {loading ? (
          <View style={styles.emptyCenter}>
            <ActivityIndicator size="large" color={Colors.slate400} />
          </View>
        ) : recentIncidents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <FileText size={24} color={Colors.slate400} />
            </View>
            <Text style={styles.emptyText}>No reports submitted yet. Tap the button above to submit an emergency report.</Text>
          </View>
        ) : (
          recentIncidents.map((incident) => {
            const IconComp = getTypeIcon(incident);
            const badge = getStatusBadge(incident.status);
            const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';
            const statusStr = incident.status || 'REPORTED';

            const isReportedActive = ['REPORTED', 'VERIFIED', 'RESPONDING', 'ON_SCENE', 'RESOLVED', 'CLOSED'].includes(statusStr);
            const isRespondingActive = ['RESPONDING', 'ON_SCENE', 'RESOLVED', 'CLOSED'].includes(statusStr);
            const isOnSceneActive = ['ON_SCENE', 'RESOLVED', 'CLOSED'].includes(statusStr);
            const isResolvedActive = statusStr === 'RESOLVED';

            return (
              <TouchableOpacity
                key={incident.incident_id}
                onPress={() => navigation.navigate('ReportDetails', { incident })}
                activeOpacity={0.8}
                style={styles.incidentCard}
              >
                <View style={styles.incidentTopBlock}>
                  <View style={[
                    styles.incidentIcon,
                    { backgroundColor: isResolved ? Colors.slate50 : '#FEF2F2' }
                  ]}>
                    <IconComp size={24} color={isResolved ? Colors.slate400 : '#EF4444'} />
                  </View>
                  <View style={styles.incidentInfo}>
                    <View style={styles.incidentTopRow}>
                      <Text style={styles.incidentType} numberOfLines={1}>
                        {incident.incident_type?.name || 'Incident'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        {isResolved && <ShieldCheck size={10} color={badge.text} />}
                        <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <View style={styles.incidentMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={Colors.slate500} />
                        <Text style={styles.metaText}>{getTimeAgo(incident.reported_at)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MapPin size={12} color={Colors.slate500} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {incident.map_pin_address || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Direct 4-Step Progress Tracker */}
                <View style={styles.stepTrackerBox}>
                  <Text style={[styles.stepItemText, isReportedActive && styles.stepItemActive]}>1. Reported</Text>
                  <View style={styles.stepLine} />
                  <Text style={[styles.stepItemText, isRespondingActive && styles.stepItemActive]}>2. Responding</Text>
                  <View style={styles.stepLine} />
                  <Text style={[styles.stepItemText, isOnSceneActive && styles.stepItemActive]}>3. On Scene</Text>
                  <View style={styles.stepLine} />
                  <Text style={[styles.stepItemText, isResolvedActive && styles.stepItemDone]}>4. Resolved</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate50,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  greetingText: {
    color: '#94A3B8',
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emergencyBtn: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  emergencyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  emergencySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencySub: {
    fontSize: 13,
    color: 'rgba(255, 228, 230, 0.9)',
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyCenter: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.slate200,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.slate500,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  incidentCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  incidentTopBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  incidentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentInfo: {
    flex: 1,
  },
  incidentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentType: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate800,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  incidentMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate500,
    fontWeight: '500',
  },
  stepTrackerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stepItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  stepItemActive: {
    color: '#4F46E5',
  },
  stepItemDone: {
    color: '#10B981',
    fontWeight: '800',
  },
  stepLine: {
    width: 8,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
});
