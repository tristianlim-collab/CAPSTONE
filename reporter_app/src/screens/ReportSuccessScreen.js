import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowRight, UserCheck, Smartphone } from 'lucide-react-native';
import { Colors, FontSizes, BorderRadius } from '../theme/colors';

export default function ReportSuccessScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.bgOrb} />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconGlow} />
          <LinearGradient colors={['#10B981', '#059669']} style={styles.iconCircle}>
            <ShieldCheck size={56} color={Colors.white} />
          </LinearGradient>
          <View style={styles.emojiBounce}>
            <Text style={{ fontSize: 20 }}>🙌</Text>
          </View>
        </View>

        <Text style={styles.title}>Report Sent!</Text>
        <Text style={styles.subtitle}>
          Authorities have been strictly notified. Stay calm, units are being dispatched to your exact location.
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.greenBar} />
          <Text style={styles.infoTitle}>WHAT HAPPENS NEXT?</Text>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.primaryFaint }]}>
              <UserCheck size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Command Center Review</Text>
              <Text style={styles.stepDesc}>Your details are instantly verified by operators.</Text>
            </View>
          </View>

          <View style={styles.connector} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: Colors.orangeLight }]}>
              <Smartphone size={16} color={Colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Keep Your Phone Nearby</Text>
              <Text style={styles.stepDesc}>Responders may call you for further information.</Text>
            </View>
          </View>
        </View>

        {/* Return Button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
          activeOpacity={0.85}
        >
          <Text style={styles.returnText}>Return to Home</Text>
          <ArrowRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50, justifyContent: 'center', alignItems: 'center' },
  bgOrb: { position: 'absolute', top: -100, right: -80, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(16,185,129,0.08)' },
  content: { alignItems: 'center', paddingHorizontal: 24, width: '100%', maxWidth: 430 },
  iconWrap: { marginBottom: 28, alignItems: 'center' },
  iconGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(16,185,129,0.2)' },
  iconCircle: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  emojiBounce: { position: 'absolute', top: -12, right: -8, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.black, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.slate900, marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.slate500, textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: 32, maxWidth: 300 },
  infoCard: { width: '100%', backgroundColor: Colors.white, borderRadius: BorderRadius.xxl, padding: 24, shadowColor: Colors.black, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.slate100, marginBottom: 32, overflow: 'hidden' },
  greenBar: { position: 'absolute', top: 0, left: 0, width: 6, height: '200%', backgroundColor: Colors.emerald },
  infoTitle: { fontSize: 12, fontWeight: '800', color: Colors.slate400, letterSpacing: 2, marginBottom: 20 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: Colors.slate800 },
  stepDesc: { fontSize: 12, color: Colors.slate500, marginTop: 2 },
  connector: { width: 2, height: 16, backgroundColor: Colors.slate100, marginLeft: 15, marginVertical: 4 },
  returnBtn: { width: '100%', backgroundColor: Colors.slate900, borderRadius: BorderRadius.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Colors.slate900, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  returnText: { color: Colors.white, fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
