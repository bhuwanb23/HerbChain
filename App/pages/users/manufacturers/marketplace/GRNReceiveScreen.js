/**
 * GRN Receive — acknowledge a delivery shipment with accepted/rejected quantities.
 *
 * Backend: POST /api/v1/manufacturer/receive
 *          { shipment_id, accepted_quantity_kg, rejected_quantity_kg, rejection_reason }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI } from '../../../../services/apiClient';

export default function GRNReceiveScreen({ route, navigation }) {
  const { accessToken } = useAuth();
  const shipment = route.params?.shipment || {};
  const shipmentId = shipment.id || route.params?.shipmentId;

  const [acceptedQty, setAcceptedQty] = useState(String(shipment.quantity_kg || ''));
  const [rejectedQty, setRejectedQty] = useState('0');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReceive = async () => {
    const accepted = parseFloat(acceptedQty);
    const rejected = parseFloat(rejectedQty) || 0;
    if (!accepted || accepted <= 0) {
      Alert.alert('Invalid', 'Accepted quantity must be positive.');
      return;
    }
    if (rejected < 0) {
      Alert.alert('Invalid', 'Rejected quantity cannot be negative.');
      return;
    }
    setSubmitting(true);
    try {
      await ManufacturerAPI.receive(accessToken, {
        shipment_id: shipmentId,
        accepted_quantity_kg: accepted,
        rejected_quantity_kg: rejected,
        rejection_reason: rejected > 0 && rejectReason.trim() ? rejectReason.trim() : undefined,
      });
      Alert.alert('Received', 'Stock added to your inventory.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Goods Received Note</Text>
      <Text style={styles.subtitle}>Shipment: {shipment.code || shipmentId}</Text>

      <View style={styles.infoCard}>
        <InfoRow label="Batch" value={shipment.batch_code || '—'} />
        <InfoRow label="Species" value={shipment.species?.common_name || '—'} />
        <InfoRow label="Sent Qty" value={`${shipment.quantity_kg || '—'} kg`} />
        <InfoRow label="Transporter" value={shipment.transporter_name || '—'} />
      </View>

      <Text style={styles.label}>Accepted Quantity (kg)</Text>
      <TextInput
        style={styles.input}
        value={acceptedQty}
        onChangeText={setAcceptedQty}
        keyboardType="decimal-pad"
        placeholder="50"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Rejected Quantity (kg)</Text>
      <TextInput
        style={styles.input}
        value={rejectedQty}
        onChangeText={setRejectedQty}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor="#9CA3AF"
      />

      {(parseFloat(rejectedQty) || 0) > 0 && (
        <>
          <Text style={styles.label}>Rejection Reason</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            placeholder="Describe quality issue..."
            placeholderTextColor="#9CA3AF"
          />
        </>
      )}

      <TouchableOpacity
        style={[styles.primary, submitting && { opacity: 0.7 }]}
        onPress={handleReceive}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Confirm Receipt</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={irStyles.row}>
      <Text style={irStyles.label}>{label}</Text>
      <Text style={irStyles.value}>{value}</Text>
    </View>
  );
}

const irStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, marginTop: 6, color: '#111827', fontSize: 14,
  },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14, fontSize: 14 },
});
