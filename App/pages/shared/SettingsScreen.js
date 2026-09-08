import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Switch, FlatList,
} from 'react-native';
import { AuthAPI, NotificationsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
];

export default function SettingsScreen() {
  const { accessToken, user, logout } = useAuth();
  const [section, setSection] = useState('main'); // main | password | notifications | language | devices
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('en');
  const [preferences, setPreferences] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    if (accessToken && section === 'notifications') {
      setLoading(true);
      NotificationsAPI.preferences(accessToken)
        .then((data) => setPreferences(data))
        .catch(() => setPreferences({}))
        .finally(() => setLoading(false));
    }
    if (accessToken && section === 'devices') {
      setLoading(true);
      NotificationsAPI.devices(accessToken)
        .then((data) => setDevices(Array.isArray(data) ? data : data?.devices || []))
        .catch(() => setDevices([]))
        .finally(() => setLoading(false));
    }
  }, [accessToken, section]);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await AuthAPI.changePassword(accessToken, { current_password: currentPassword, new_password: newPassword });
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSection('main');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to change password.');
    }
    setSaving(false);
  };

  const saveLanguage = () => {
    Alert.alert('Language', `Language set to ${LANGUAGES.find((l) => l.code === language)?.label || language}`);
    setSection('main');
  };

  const revokeDevice = async (deviceId) => {
    Alert.alert('Revoke Device', 'Are you sure you want to revoke this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await NotificationsAPI.removeDevice(accessToken, deviceId);
            setDevices((prev) => prev.filter((d) => d.id !== deviceId));
            Alert.alert('Revoked', 'Device access revoked.');
          } catch (_) {
            Alert.alert('Error', 'Failed to revoke device.');
          }
        },
      },
    ]);
  };

  // ─── Main menu ───
  if (section === 'main') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.full_name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Unknown'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <MenuItem icon="🔒" label="Change Password" onPress={() => setSection('password')} />
          <MenuItem icon="🌐" label="Language" value={LANGUAGES.find((l) => l.code === language)?.label} onPress={() => setSection('language')} />
          <MenuItem icon="🔔" label="Notification Preferences" onPress={() => setSection('notifications')} />
          <MenuItem icon="📱" label="Device Management" onPress={() => setSection('devices')} />
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─── Password change ───
  if (section === 'password') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSection('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.form}>
          <Text style={styles.formLabel}>Current Password</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Enter current password" />

          <Text style={styles.formLabel}>New Password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Min 8 characters" />

          <Text style={styles.formLabel}>Confirm New Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter new password" />

          <TouchableOpacity style={[styles.submitBtn, saving && styles.btnDisabled]} onPress={changePassword} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Language picker ───
  if (section === 'language') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSection('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Language</Text>
          <TouchableOpacity onPress={saveLanguage}>
            <Text style={styles.saveBtn}>Save</Text>
          </TouchableOpacity>
        </View>
        <FlatList data={LANGUAGES} keyExtractor={(l) => l.code} renderItem={({ item }) => (
          <TouchableOpacity style={[styles.langRow, language === item.code && styles.langRowActive]} onPress={() => setLanguage(item.code)}>
            <Text style={[styles.langLabel, language === item.code && styles.langLabelActive]}>{item.label}</Text>
            {language === item.code && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        )} />
      </View>
    );
  }

  // ─── Notification preferences ───
  if (section === 'notifications') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSection('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 60 }} />
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
        ) : (
          <ScrollView style={{ padding: 16 }}>
            {Object.entries(preferences || {}).map(([key, value]) => (
              <View key={key} style={styles.prefRow}>
                <Text style={styles.prefLabel}>{key.replace(/_/g, ' ')}</Text>
                <Switch
                  value={Boolean(value)}
                  onValueChange={async (val) => {
                    const updated = { ...preferences, [key]: val };
                    setPreferences(updated);
                    try { await NotificationsAPI.updatePreferences(accessToken, updated); } catch (_) {}
                  }}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={value ? '#3B82F6' : '#F3F4F6'}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // ─── Device management ───
  if (section === 'devices') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSection('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Devices</Text>
          <View style={{ width: 60 }} />
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
        ) : devices.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>No registered devices</Text>
          </View>
        ) : (
          <FlatList data={devices} keyExtractor={(d) => String(d.id)} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => (
            <View style={styles.deviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{item.device_name || item.platform || 'Device'}</Text>
                <Text style={styles.deviceMeta}>{item.platform} · {item.app_version || 'N/A'}</Text>
                {item.last_sync_at && <Text style={styles.deviceMeta}>Last sync: {new Date(item.last_sync_at).toLocaleDateString()}</Text>}
              </View>
              <TouchableOpacity onPress={() => revokeDevice(item.id)} style={styles.revokeBtn}>
                <Text style={styles.revokeBtnText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          )} />
        )}
      </View>
    );
  }

  return null;
}

function MenuItem({ icon, label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuItemIcon}>{icon}</Text>
      <Text style={styles.menuItemLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={styles.menuItemValue}>{value}</Text>}
      <Text style={styles.menuItemArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  saveBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '700' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  userRole: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  userEmail: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  menuSection: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  menuItemIcon: { fontSize: 18, marginRight: 12 },
  menuItemLabel: { fontSize: 15, color: '#111827', fontWeight: '600' },
  menuItemValue: { fontSize: 14, color: '#6B7280', marginRight: 6 },
  menuItemArrow: { fontSize: 18, color: '#D1D5DB' },
  logoutBtn: { padding: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '700' },
  form: { padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#111827',
  },
  submitBtn: {
    backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  langRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  langRowActive: { backgroundColor: '#EFF6FF' },
  langLabel: { fontSize: 16, color: '#111827', flex: 1 },
  langLabelActive: { color: '#3B82F6', fontWeight: '700' },
  checkmark: { fontSize: 18, color: '#3B82F6', fontWeight: '700' },
  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  prefLabel: { fontSize: 15, color: '#111827', textTransform: 'capitalize', flex: 1 },
  deviceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8,
  },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  deviceMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  revokeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FEE2E2' },
  revokeBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },
});
