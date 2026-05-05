import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Modal, StatusBar, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, User, Phone, LogOut, Shield, Key, Edit2, X,
  FileText, ChevronRight, Loader2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { Colors, Spacing, FontSizes, BorderRadius } from '../theme/colors';
import { Alert } from 'react-native';

export default function ReporterProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, checkAuth } = useAuth();

  const [editVisible, setEditVisible] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', contact_number: '' });
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const openEdit = () => {
    setFormData({ name: user?.name || '', email: user?.email || '', contact_number: user?.contact_number || '' });
    setEditVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await authAPI.updateProfile(formData);
      Alert.alert('Success', 'Profile updated');
      setEditVisible(false);
      await checkAuth();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (pwData.newPassword !== pwData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    try {
      setSaving(true);
      await authAPI.updatePassword({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      Alert.alert('Success', 'Password updated');
      setPwVisible(false);
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={Colors.slate600} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={openEdit} style={styles.editBtn}>
          <Edit2 size={20} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={[Colors.primary, Colors.indigo]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name || 'Citizen User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.emeraldLight }]}>
              <Phone size={20} color={Colors.emerald} />
            </View>
            <View>
              <Text style={styles.infoLabel}>PHONE NUMBER</Text>
              <Text style={styles.infoValue}>{user?.contact_number || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.primaryFaint }]}>
              <Shield size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>ROLE</Text>
              <Text style={styles.infoValue}>{user?.role === 'REPORTER' ? 'Verified Reporter' : user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Action List */}
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('MyReports')}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.indigoLight }]}>
                <FileText size={16} color={Colors.indigo} />
              </View>
              <Text style={styles.actionText}>My Incident Reports</Text>
            </View>
            <ChevronRight size={20} color={Colors.slate400} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => setPwVisible(true)}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.slate100 }]}>
                <Key size={16} color={Colors.slate600} />
              </View>
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <ChevronRight size={20} color={Colors.slate400} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalClose}><X size={20} color={Colors.slate400} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.modalInput} value={formData.name} onChangeText={v => setFormData({ ...formData, name: v })} placeholder="Your Name" placeholderTextColor={Colors.slate400} />
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.modalInput} value={formData.email} onChangeText={v => setFormData({ ...formData, email: v })} placeholder="you@example.com" placeholderTextColor={Colors.slate400} keyboardType="email-address" />
              <Text style={styles.fieldLabel}>Contact Number</Text>
              <TextInput style={styles.modalInput} value={formData.contact_number} onChangeText={v => setFormData({ ...formData, contact_number: v })} placeholder="+63 900 000 0000" placeholderTextColor={Colors.slate400} keyboardType="phone-pad" />
              <TouchableOpacity onPress={handleUpdateProfile} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={[styles.modalSubmit, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.modalSubmitText}>Save Changes</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={pwVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPwVisible(false)} style={styles.modalClose}><X size={20} color={Colors.slate400} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput style={styles.modalInput} value={pwData.currentPassword} onChangeText={v => setPwData({ ...pwData, currentPassword: v })} secureTextEntry />
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput style={styles.modalInput} value={pwData.newPassword} onChangeText={v => setPwData({ ...pwData, newPassword: v })} secureTextEntry />
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput style={styles.modalInput} value={pwData.confirmPassword} onChangeText={v => setPwData({ ...pwData, confirmPassword: v })} secureTextEntry />
              <TouchableOpacity onPress={handleUpdatePassword} disabled={saving} activeOpacity={0.85}>
                <View style={[styles.pwSubmit, saving && { opacity: 0.6 }]}>
                  {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <><Key size={18} color={Colors.white} /><Text style={styles.modalSubmitText}> Update Password</Text></>}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.slate50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.slate200 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.slate800 },
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: Colors.white, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.slate800, letterSpacing: -0.3 },
  userEmail: { fontSize: 14, color: Colors.slate500, marginTop: 4 },
  infoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)', overflow: 'hidden', marginBottom: 16, shadowColor: Colors.black, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.slate400, letterSpacing: 1 },
  infoValue: { fontSize: 15, fontWeight: '500', color: Colors.slate700, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.slate100 },
  actionCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)', overflow: 'hidden', marginBottom: 16, shadowColor: Colors.black, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '500', color: Colors.slate700 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.xl, padding: 16, marginTop: 16 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.slate100 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.slate800 },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.slate50, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: Colors.slate700, textTransform: 'uppercase', marginBottom: 6 },
  modalInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.slate200, borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 14, color: Colors.slate800, marginBottom: 14 },
  modalSubmit: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginTop: 4 },
  modalSubmitText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  pwSubmit: { backgroundColor: Colors.slate800, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
