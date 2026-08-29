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
  Flame, Activity, Stethoscope, Car
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { incidentAPI } from '../api';
import { OfflineQueueService } from '../services/offlineQueueService';

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

  useEffect(() => {
    // Attempt auto-syncing any offline queued reports on screen load
    OfflineQueueService.syncQueue();

    const fetchIncidents = async () => {
      try {
        const res = await incidentAPI.getAll({ limit: 50 });
        const list = res.data?.data || [];
        setIncidents(list);
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    const unsub1 = on('incident_status_updated', (data) => {
      setIncidents(prev => {
        const newList = prev.map(inc =>
          inc.incident_id === data.incident_id
            ? { ...inc, status: data.status, ...(data.incident || {}) }
            : inc
        );
        return newList;
      });
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
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
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
      <StatusBar barStyle="dark-content" backgroundColor={Colors.slate50} />

      {/* Light clean header background */}
      <View style={[styles.headerBg, { paddingTop: insets.top }]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Citizen'} 👋</Text>
          </View>
        </View>

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

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <FileText size={60} color={Colors.primaryFaint} style={styles.statBgIcon} />
            <Text style={styles.statLabel}>TOTAL REPORTS</Text>
            {loading ? (
              <ActivityIndicator color={Colors.slate300} size="small" />
            ) : (
              <Text style={styles.statValue}>{totalReports}</Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Activity size={60} color={Colors.orangeLight} style={styles.statBgIcon} />
            <View style={styles.statLabelRow}>
              {activeCount > 0 && <View style={styles.pulseDot} />}
              <Text style={[styles.statLabel, { color: Colors.orange }]}>ACTIVE</Text>
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.slate300} size="small" />
            ) : (
              <Text style={styles.statValue}>{activeCount}</Text>
            )}
          </View>
        </View>


        {/* Recent Activity Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyReports')}>
            <Text style={styles.viewAllBtn}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Incidents List */}
        {loading ? (
          <View style={styles.emptyCenter}>
            <ActivityIndicator size="large" color={Colors.slate400} />
          </View>
        ) : recentIncidents.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <FileText size={24} color={Colors.slate400} />
            </View>
            <Text style={styles.emptyText}>No reports yet. Tap the button above to submit one.</Text>
          </View>
        ) : (
          recentIncidents.map((incident) => {
            const IconComp = getTypeIcon(incident);
            const badge = getStatusBadge(incident.status);
            const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';
            return (
              <TouchableOpacity
                key={incident.incident_id}
                onPress={() => navigation.navigate('ReportDetails', { incident })}
                activeOpacity={0.7}
                style={[styles.incidentCard, isResolved && { opacity: 0.85 }]}
              >
                <View style={[
                  styles.incidentIcon,
                  { backgroundColor: isResolved ? Colors.slate50 : Colors.orangeLight }
                ]}>
                  <IconComp size={24} color={isResolved ? Colors.slate400 : Colors.orange} />
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
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom spacing for tab bar */}
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
    backgroundColor: Colors.slate50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
  },
  greetingText: {
    color: Colors.slate500,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    color: Colors.slate800,
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  emergencyBtn: {
    borderRadius: BorderRadius.xxxl,
    padding: 28,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  emergencyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emergencySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emergencySub: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,228,230,0.9)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.slate200,
    overflow: 'hidden',
  },
  statBgIcon: {
    position: 'absolute',
    right: -12,
    top: -12,
    opacity: 0.6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate400,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.slate800,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.slate800,
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primaryDark,
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
    borderRadius: BorderRadius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  incidentIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.slate500,
    fontWeight: '500',
  },
});
