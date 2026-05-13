/**
 * Registration screen — opens from the login screen and POSTs to /auth/register.
 * On success, AuthContext.register() stores the session and the AuthGate in
 * AppNavigator automatically swaps to the role-specific dashboard.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaWrapper, BottomSpacer } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

const ROLES = [
  { id: 'farmer', label: 'Farmer' },
  { id: 'transporter', label: 'Transporter' },
  { id: 'lab', label: 'Lab' },
  { id: 'manufacturer', label: 'Manufacturer' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'admin', label: 'Admin / Regulator' },
];

export default function RegisterScreen({ navigation }) {
  const { register, busy, error } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('farmer');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Required', 'Name, email and password are required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }
    try {
      await register({
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        password,
      });
      // AuthGate will redirect automatically.
    } catch (err) {
      Alert.alert('Could not register', err?.message || 'Try again');
    }
  };

  return (
    <SafeAreaWrapper style={styles.container} includeBottom>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create your HerbChain account</Text>
          <Text style={styles.subtitle}>Choose your role and sign up to get started.</Text>

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[styles.roleChip, role === r.id && styles.roleChipActive]}
              >
                <Text style={[styles.roleText, role === r.id && styles.roleTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91…"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, State"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
            placeholderTextColor="#9CA3AF"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submit, busy && styles.submitBusy]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Already have an account? Log in</Text>
          </TouchableOpacity>

          <BottomSpacer extraPadding={32} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 64 },
  title: { fontSize: 24, fontWeight: '700', color: '#065F46', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#374151', marginBottom: 16, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  roleText: { color: '#374151', fontWeight: '500' },
  roleTextActive: { color: '#FFFFFF' },
  error: { color: '#DC2626', marginTop: 16, textAlign: 'center' },
  submit: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBusy: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  backLink: { marginTop: 18, alignItems: 'center' },
  backLinkText: { color: '#065F46', fontWeight: '500' },
});
