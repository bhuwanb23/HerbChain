/**
 * Batch Dossier — full traceability for a certified batch + procurement request action.
 *
 * Backend: GET /api/v1/manufacturer/certified-batches/:batchId
 *          POST /api/v1/manufacturer/request-batch
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI } from '../../../../services/apiClient';

export default function BatchDossierScreen({ route, navigation }) {
  const { accessToken } = useAuth();
  const { batchId, batch: batchStub } = route.params;
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await ManufacturerAPI.certifiedBatch(accessToken, batchId);
        setDossier(data.batch);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, batchId]);

  const handleRequest = async () => {
    const quantity = parseFloat(qty);
    if (!quantity || quantity <= 0) {
      Alert.alert('Invalid', 'Enter a positive quantity in kg.');
      return;
    }
    setSubmitting(true);
    try {
      await ManufacturerAPI.requestBatch(accessToken, {
        batch_id: batchId,
        requested_quantity_kg: quantity,
        notes: notes.trim() || undefined,
      });
      setRequestOpen(false);
      setQty('');
      setNotes('');
      Alert.alert('Requested', 'Procurement request submitted. The holder will review it.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#F97316" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  const d = dossier || batchStub || {};
  const ownership = d.ownership || {};
  const certs = d.certifications || [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{d.species?.common_name || d.species?.code || 'Batch'}</Text>
      <Text style={styles.code}>{d.code || batchId}</Text>

      {/* Weight & availability */}
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{d.weight_kg || '—'}</Text>
          <Text style={styles.statLabel}>Total kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{d.available_kg || d.weight_kg || '—'}</Text>
          <Text style={styles.statLabel}>Available kg</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{d.harvest_date?.slice(0, 10) || '—'}</Text>
          <Text style={styles.statLabel}>Harvested</Text>
        </View>
      </View>

      {/* Ownership */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership</Text>
        <InfoRow label="Farmer" value={ownership.farmer_name || d.farmer_name || '—'} />
        <InfoRow label="Location" value={d.location || '—'} />
        <InfoRow label="Cultivation" value={d.cultivation_method || '—'} />
        {d.gps_lat && <InfoRow label="GPS" value={`${d.gps_lat}, ${d.gps_lng}`} />}
      </View>

      {/* Lab certifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certs.length === 0 ? (
          <Text style={styles.empty}>No certifications</Text>
        ) : (
          certs.map((c, i) => (
            <View key={c.id || i} style={styles.certCard}>
              <Text style={styles.certLevel}>{c.level || c.certification_level || 'Standard'}</Text>
              <Text style={styles.certMeta}>Lab: {c.lab_name || c.lab_user_id || '—'}</Text>
              <Text style={styles.certMeta}>Issued: {c.issued_at?.slice(0, 10) || '—'}</Text>
            </View>
          ))
        )}
      </View>

      {/* Tests summary */}
      {d.tests && d.tests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lab Tests ({d.tests.length})</Text>
          {d.tests.map((t, i) => (
            <View key={t.id || i} style={styles.testRow}>
              <Text style={styles.testCat}>{t.category || t.test_type || '—'}</Text>
              <Text style={[styles.testResult, { color: t.result === 'pass' || t.status === 'approved' ? '#10B981' : '#EF4444' }]}>
                {t.result || t.status || '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primary} onPress={() => setRequestOpen(true)}>
        <Text style={styles.primaryText}>Request Procurement</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Request modal */}
      <Modal visible={requestOpen} animationType="slide" onRequestClose={() => setRequestOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Request this batch</Text>
          <Text style={styles.modalSub}>Specify the quantity you need (kg)</Text>

          <Text style={styles.label}>Quantity (kg)</Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="decimal-pad"
            placeholder="e.g. 50"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Any special requirements..."
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            style={[styles.primary, submitting && { opacity: 0.7 }]}
            onPress={handleRequest}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Submit Request</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRequestOpen(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  code: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  empty: { fontSize: 13, color: '#9CA3AF' },
  certCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#D1FAE5' },
  certLevel: { fontSize: 14, fontWeight: '700', color: '#059669' },
  certMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  testRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  testCat: { fontSize: 13, color: '#374151' },
  testResult: { fontSize: 13, fontWeight: '700' },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  modal: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#C2410C', marginTop: 12 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, marginTop: 6, color: '#111827', fontSize: 14,
  },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14, fontSize: 14 },
});
