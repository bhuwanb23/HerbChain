/**
 * Recall Impact — flag a batch for recall, view affected products, resolve.
 *
 * Backend: GET  /api/v1/manufacturer/recall/:batchId
 *          GET  /api/v1/manufacturing/impacts?status=
 *          POST /api/v1/manufacturing/impacts        { batch_id, impact_type, notes }
 *          POST /api/v1/manufacturing/impacts/:id/resolve
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI, ManufacturingAPI } from '../../../../services/apiClient';

export default function RecallImpactScreen() {
  const { accessToken } = useAuth();
  const [impacts, setImpacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagOpen, setFlagOpen] = useState(false);
  const [batchCode, setBatchCode] = useState('');
  const [impactType, setImpactType] = useState('recall');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ManufacturingAPI.impacts(accessToken);
      setImpacts(data.impacts || []);
    } catch (err) {
      console.error('[RecallImpact]', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleFlag = async () => {
    if (!batchCode.trim()) {
      Alert.alert('Required', 'Enter a batch code or ID.');
      return;
    }
    setSubmitting(true);
    try {
      await ManufacturingAPI.createImpact(accessToken, {
        batch_id: batchCode.trim(),
        impact_type: impactType,
        notes: notes.trim() || undefined,
      });
      setFlagOpen(false);
      setBatchCode('');
      setNotes('');
      load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (impactId) => {
    try {
      await ManufacturingAPI.resolveImpact(accessToken, impactId, { note: 'Resolved' });
      load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recall Impact</Text>
        <TouchableOpacity style={styles.flagBtn} onPress={() => setFlagOpen(true)}>
          <Text style={styles.flagText}>+ Flag Batch</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={impacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{item.batch_code || item.batch_id?.slice(0, 8)}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'resolved' ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'resolved' ? '#059669' : '#991B1B' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>Type: {item.impact_type}</Text>
              <Text style={styles.meta}>Affected products: {item.affected_count || item.products_count || '—'}</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
              {item.status !== 'resolved' && (
                <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item.id)}>
                  <Text style={styles.resolveText}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No recall impacts flagged.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Flag modal */}
      <Modal visible={flagOpen} animationType="slide" onRequestClose={() => setFlagOpen(false)}>
        <ScrollView style={styles.modal}>
          <Text style={styles.modalTitle}>Flag Batch for Recall</Text>

          <Text style={styles.label}>Batch Code or ID *</Text>
          <TextInput
            style={styles.input}
            value={batchCode}
            onChangeText={setBatchCode}
            placeholder="e.g. BTS-2026-000042"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Impact Type</Text>
          <View style={styles.typeRow}>
            {['recall', 'contamination', 'quality_issue'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, impactType === t && styles.typeChipActive]}
                onPress={() => setImpactType(t)}
              >
                <Text style={[styles.typeText, impactType === t && styles.typeTextActive]}>{t.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Describe the issue..."
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            style={[styles.primary, submitting && { opacity: 0.7 }]}
            onPress={handleFlag}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Flag for Recall</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlagOpen(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  flagBtn: { backgroundColor: '#EF4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  flagText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: '#374151', marginTop: 4 },
  notes: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  resolveBtn: { marginTop: 8, padding: 8, backgroundColor: '#D1FAE5', borderRadius: 8, alignItems: 'center' },
  resolveText: { color: '#059669', fontWeight: '700', fontSize: 12 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  modal: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#C2410C', marginTop: 12, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginTop: 6, color: '#111827', fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
  typeChipActive: { backgroundColor: '#EF4444' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  typeTextActive: { color: '#FFF' },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14, fontSize: 14 },
});
