/**
 * LabCertificate — issue a Certificate of Analysis for a batch.
 * Backend: POST /api/v1/labs/certificates { batch_id, notes, cert_level }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const CERT_LEVELS = ['standard', 'premium', 'organic'];

export default function LabCertificate({ route, navigation }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [certLevel, setCertLevel] = useState('standard');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await LabsAPI.issueCertificate(accessToken, {
        batch_id: batchId,
        cert_level: certLevel,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Certificate Issued', 'Certificate of Analysis has been generated.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to issue certificate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Issue Certificate</Text>
      <Text style={styles.subtitle}>Batch: {batchId}</Text>

      <Text style={styles.label}>Certificate Level *</Text>
      <View style={styles.chipRow}>
        {CERT_LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[styles.chip, certLevel === l && styles.chipActive]}
            onPress={() => setCertLevel(l)}
          >
            <Text style={[styles.chipText, certLevel === l && styles.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="Certification notes, observations, conditions..."
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Issue Certificate</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
