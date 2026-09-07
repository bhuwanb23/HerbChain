/**
 * LabReject — reject a batch with structured reason.
 * Backend: POST /api/v1/labs/reject { batch_id, reason, remarks }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const REJECTION_REASONS = [
  'species_mismatch', 'contamination', 'quality_below_threshold',
  'missing_documentation', 'wrong_quantity', 'damaged_goods',
  'expired_harvest', 'pesticide_detected', 'heavy_metals_exceeded',
];

export default function LabReject({ route, navigation }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [reason, setReason] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Required', 'Select a rejection reason');
      return;
    }
    setSubmitting(true);
    try {
      await LabsAPI.rejectBatch(accessToken, {
        batch_id: batchId,
        reason,
        remarks: remarks.trim() || undefined,
      });
      Alert.alert('Batch Rejected', 'The batch has been rejected and the farmer will be notified.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reject Batch</Text>
      <Text style={styles.subtitle}>Batch: {batchId}</Text>

      <Text style={styles.label}>Rejection Reason *</Text>
      {REJECTION_REASONS.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.reasonBtn, reason === r && styles.reasonActive]}
          onPress={() => setReason(r)}
        >
          <View style={[styles.radio, reason === r && styles.radioActive]} />
          <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r.replace(/_/g, ' ')}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Remarks</Text>
      <TextInput
        style={[styles.input, { minHeight: 100 }]}
        value={remarks}
        onChangeText={setRemarks}
        multiline
        placeholder="Additional details about the rejection..."
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        style={[styles.submitBtn, (!reason || submitting) && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={!reason || submitting}
      >
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Reject Batch</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 12 },
  reasonBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  reasonActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12 },
  radioActive: { borderColor: '#EF4444', backgroundColor: '#EF4444' },
  reasonText: { fontSize: 14, color: '#374151', textTransform: 'capitalize' },
  reasonTextActive: { color: '#EF4444', fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
