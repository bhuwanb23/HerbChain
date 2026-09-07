/**
 * DeliveryFailure — transporter reports a failed delivery.
 *
 * Backend: POST /api/v1/shipments/:id/fail { reason, remarks }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ShipmentsAPI } from '../../../services/apiClient';

const FAILURE_REASONS = [
  { key: 'receiver_refused', label: 'Receiver refused delivery' },
  { key: 'wrong_address', label: 'Wrong address / location not found' },
  { key: 'damaged_goods', label: 'Goods damaged in transit' },
  { key: 'incomplete_order', label: 'Incomplete order / missing items' },
  { key: 'quality_issue', label: 'Quality issue at delivery' },
  { key: 'no_answer', label: 'No answer at destination' },
  { key: 'other', label: 'Other' },
];

export default function DeliveryFailure({ route, navigation }) {
  const { accessToken } = useAuth();
  const shipmentId = route?.params?.shipmentId;
  const [selectedReason, setSelectedReason] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a failure reason');
      return;
    }
    setSubmitting(true);
    try {
      await ShipmentsAPI.fail(accessToken, shipmentId, {
        reason: selectedReason,
        remarks: remarks.trim() || undefined,
      });
      Alert.alert('Failure Reported', 'Shipment has been marked as failed.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not report failure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Delivery Failure</Text>
        <Text style={styles.subtitle}>Select the reason and add details</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Failure Reason *</Text>
        {FAILURE_REASONS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.reasonBtn, selectedReason === r.key && styles.reasonBtnActive]}
            onPress={() => setSelectedReason(r.key)}
          >
            <View style={[styles.radio, selectedReason === r.key && styles.radioActive]} />
            <Text style={[styles.reasonText, selectedReason === r.key && styles.reasonTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.field}>
          <Text style={styles.label}>Additional Remarks</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Describe the issue..."
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!selectedReason || submitting) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!selectedReason || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Report Failure</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  form: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  reasonBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 14, marginBottom: 8,
  },
  reasonBtnActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: '#D1D5DB', marginRight: 12,
  },
  radioActive: { borderColor: '#EF4444', backgroundColor: '#EF4444' },
  reasonText: { fontSize: 14, color: '#374151' },
  reasonTextActive: { color: '#EF4444', fontWeight: '600' },
  field: { marginTop: 16 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 20,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
