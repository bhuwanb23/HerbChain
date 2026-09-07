/**
 * LabBatchDetail — full detail for a batch in the lab pipeline.
 *
 * Backend: GET /api/v1/labs/batches/:batchId, GET /api/v1/labs/samples,
 *          GET /api/v1/labs/tests, GET /api/v1/labs/certificates
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

export default function LabBatchDetail({ route, navigation }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [batch, setBatch] = useState(null);
  const [samples, setSamples] = useState([]);
  const [tests, setTests] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!batchId || !accessToken) return;
    try {
      setLoading(true);
      const [b, s, t, c] = await Promise.all([
        LabsAPI.batchDetail(accessToken, batchId),
        LabsAPI.listSamples(accessToken, { batch_id: batchId }).catch(() => ({ samples: [] })),
        LabsAPI.listTests(accessToken, { batch_id: batchId }).catch(() => ({ tests: [] })),
        LabsAPI.listCertificates(accessToken, batchId).catch(() => ({ certifications: [] })),
      ]);
      setBatch(b?.batch || b);
      setSamples(s?.samples || []);
      setTests(t?.tests || []);
      setCerts(c?.certifications || c || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  }, [batchId, accessToken]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  }

  if (!batch) {
    return <View style={styles.center}><Text style={styles.empty}>Batch not found</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Batch info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Batch Information</Text>
        <InfoRow label="Code" value={batch.code} />
        <InfoRow label="Species" value={batch.species?.common_name || batch.species?.code || '—'} />
        <InfoRow label="Weight" value={`${batch.weight_kg || '—'} kg`} />
        <InfoRow label="Farmer" value={batch.farmer?.name || batch.farmer?.id || '—'} />
        <InfoRow label="Location" value={batch.location || '—'} />
        <InfoRow label="Phase" value={batch.phase || '—'} />
        <InfoRow label="Test Status" value={batch.test_status || 'pending'} />
      </View>

      {/* Samples */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Samples ({samples.length})</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation?.navigate?.('LabSampleCreate', { batchId })}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {samples.length === 0 ? (
          <Text style={styles.emptyText}>No samples yet. Create one to start testing.</Text>
        ) : (
          samples.map((s) => (
            <View key={s.id} style={styles.listItem}>
              <Text style={styles.listItemTitle}>{s.sample_code || s.id}</Text>
              <Text style={styles.listItemMeta}>{s.sample_type || '—'} · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </View>

      {/* Tests */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Tests ({tests.length})</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation?.navigate?.('LabTestCreate', { batchId, samples })}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {tests.length === 0 ? (
          <Text style={styles.emptyText}>No tests yet. Create a sample first, then add tests.</Text>
        ) : (
          tests.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.listItem}
              onPress={() => navigation?.navigate?.('LabTestEntry', { testId: t.id })}
            >
              <Text style={styles.listItemTitle}>{t.test_category || t.test_type || 'Test'}</Text>
              <Text style={styles.listItemMeta}>{t.status || '—'} · {t.sample?.sample_code || '—'}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Certificates */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Certificates ({certs.length})</Text>
        </View>
        {certs.length === 0 ? (
          <Text style={styles.emptyText}>No certificates yet.</Text>
        ) : (
          certs.map((c) => (
            <View key={c.id} style={styles.listItem}>
              <Text style={styles.listItemTitle}>Certificate {c.certificate_number || c.id}</Text>
              <Text style={styles.listItemMeta}>{c.status || '—'} · {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : ''}</Text>
            </View>
          ))
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
          onPress={() => navigation?.navigate?.('LabCertificate', { batchId })}
        >
          <Text style={styles.actionTextWhite}>Issue Certificate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }]}
          onPress={() => navigation?.navigate?.('LabReject', { batchId })}
        >
          <Text style={styles.actionTextRed}>Reject Batch</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: '#6B7280', fontSize: 14 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { backgroundColor: '#8B5CF620', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  addBtnText: { color: '#8B5CF6', fontWeight: '600', fontSize: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  listItem: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  listItemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actions: { marginTop: 8, gap: 10 },
  actionBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionTextWhite: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  actionTextRed: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
