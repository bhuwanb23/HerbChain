/**
 * Lab v1 home — scan to receive a batch, then file an approve/reject report.
 *
 * Backed by:
 *     GET  /api/v1/batches/mine
 *     GET  /api/v1/batches/available/for-lab     (visible inbox of incoming work)
 *     POST /api/v1/batches/<id>/transfer
 *     POST /api/v1/lab-reports
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RoleHomeShell, ScanQrSheet } from '../../../components';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, BatchesAPI, LabReportsAPI, TraceabilityAPI } from '../../../services/apiClient';

const PHASE_LABEL = {
  in_transit_to_lab: 'Coming in',
  at_lab: 'At your lab',
};

export default function LabHome() {
  const { accessToken, user } = useAuth();
  const [mine, setMine] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [reportingBatch, setReportingBatch] = useState(null);
  const [reportForm, setReportForm] = useState({
    test_type: 'Pesticides & purity',
    test_date: new Date().toISOString().slice(0, 10),
    results_summary: '',
    outcome: 'approved',
    purity_percentage: '',
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mineRes, inboxRes] = await Promise.all([
        BatchesAPI.listMine(accessToken),
        BatchesAPI.availableForLab(accessToken).catch(() => ({ batches: [] })),
      ]);
      setMine(mineRes.batches || []);
      setInbox((inboxRes.batches || []).filter((b) => b.state.phase === 'in_transit_to_lab'));
    } catch (err) {
      Alert.alert('Could not load lab data', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleScan = async (token) => {
    setScanning(true);
    try {
      const resolved = await TraceabilityAPI.resolve(token);
      if (resolved.kind !== 'batch') {
        Alert.alert('Wrong QR', 'This is not a batch QR.');
        return;
      }
      const batchId = resolved.journey.batch_id;
      const result = await BatchesAPI.transfer(accessToken, batchId, {
        scanned_qr_token: token,
        location: user?.location || undefined,
      });
      setScanOpen(false);
      await load();
      Alert.alert('Batch received', `${result.transfer.batch_id} is now at your lab.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed';
      Alert.alert('Could not receive', msg);
    } finally {
      setScanning(false);
    }
  };

  const submitReport = async () => {
    if (!reportingBatch) return;
    if (!reportForm.results_summary.trim()) {
      Alert.alert('Summary required', 'Add a one-line summary of the test result.');
      return;
    }
    setSubmittingReport(true);
    try {
      await LabReportsAPI.create(accessToken, {
        batch_id: reportingBatch.herb.batch_id,
        test_type: reportForm.test_type,
        test_date: reportForm.test_date,
        results_summary: reportForm.results_summary,
        outcome: reportForm.outcome,
        purity_percentage: reportForm.purity_percentage
          ? Number(reportForm.purity_percentage)
          : undefined,
      });
      setReportingBatch(null);
      setReportForm({
        test_type: 'Pesticides & purity',
        test_date: new Date().toISOString().slice(0, 10),
        results_summary: '',
        outcome: 'approved',
        purity_percentage: '',
      });
      await load();
      Alert.alert('Report filed', 'Quality result has been recorded on-chain.');
    } catch (err) {
      Alert.alert('Could not file report', err?.message || 'Failed');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <RoleHomeShell
      title="Lab inbox"
      subtitle="Receive samples, file lab reports"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <TouchableOpacity style={styles.primary} onPress={() => setScanOpen(true)}>
        <Text style={styles.primaryText}>Scan to receive</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Incoming (with transporters)</Text>
      {inbox.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing on its way.</Text>
        </View>
      ) : (
        inbox.map((b) => (
          <View key={b.herb.batch_id} style={styles.card}>
            <Text style={styles.cardTitle}>{b.herb.species_name}</Text>
            <Text style={styles.cardMeta}>
              {b.herb.batch_id} · {b.herb.weight_kg} kg
            </Text>
            <Text style={styles.phase}>{PHASE_LABEL[b.state.phase] || b.state.phase}</Text>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>At your lab</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#8B5CF6" />
        </View>
      ) : mine.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No batches at your lab right now.</Text>
        </View>
      ) : (
        mine.map((b) => (
          <View key={b.herb.batch_id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{b.herb.species_name}</Text>
                <Text style={styles.cardMeta}>
                  {b.herb.batch_id} · current test: {b.state.test_result}
                </Text>
              </View>
              {b.state.phase === 'at_lab' && b.state.test_result === 'pending' ? (
                <TouchableOpacity
                  style={styles.fileReport}
                  onPress={() => setReportingBatch(b)}
                >
                  <Text style={styles.fileReportText}>File report</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}

      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <ScanQrSheet
          title="Scan to receive sample"
          onScanned={handleScan}
          onCancel={() => setScanOpen(false)}
          busy={scanning}
        />
      </Modal>

      <Modal
        visible={Boolean(reportingBatch)}
        animationType="slide"
        onRequestClose={() => setReportingBatch(null)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            File lab report for {reportingBatch?.herb?.batch_id}
          </Text>
          <Text style={styles.label}>Test type</Text>
          <TextInput
            style={styles.input}
            value={reportForm.test_type}
            onChangeText={(v) => setReportForm({ ...reportForm, test_type: v })}
          />
          <Text style={styles.label}>Test date</Text>
          <TextInput
            style={styles.input}
            value={reportForm.test_date}
            onChangeText={(v) => setReportForm({ ...reportForm, test_date: v })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>Outcome</Text>
          <View style={styles.outcomeRow}>
            {['approved', 'rejected'].map((o) => (
              <TouchableOpacity
                key={o}
                onPress={() => setReportForm({ ...reportForm, outcome: o })}
                style={[
                  styles.outcomeChip,
                  reportForm.outcome === o && (o === 'approved' ? styles.approved : styles.rejected),
                ]}
              >
                <Text
                  style={[
                    styles.outcomeText,
                    reportForm.outcome === o && styles.outcomeTextActive,
                  ]}
                >
                  {o.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Purity %</Text>
          <TextInput
            style={styles.input}
            value={reportForm.purity_percentage}
            onChangeText={(v) => setReportForm({ ...reportForm, purity_percentage: v })}
            keyboardType="decimal-pad"
            placeholder="optional"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={reportForm.results_summary}
            onChangeText={(v) => setReportForm({ ...reportForm, results_summary: v })}
            multiline
            placeholder="Plain-text result summary"
            placeholderTextColor="#9CA3AF"
          />
          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.primary, submittingReport && { opacity: 0.7 }]}
            onPress={submitReport}
            disabled={submittingReport}
          >
            {submittingReport ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>File report</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReportingBatch(null)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </RoleHomeShell>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 8 },
  center: { alignItems: 'center', padding: 32 },
  empty: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: { color: '#6B7280' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  cardMeta: { color: '#374151', fontSize: 13, marginTop: 4 },
  phase: { color: '#8B5CF6', fontWeight: '600', marginTop: 6 },
  fileReport: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  fileReportText: { color: '#FFF', fontWeight: '700' },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#5B21B6', marginVertical: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    color: '#111827',
  },
  outcomeRow: { flexDirection: 'row', marginTop: 8, gap: 10 },
  outcomeChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    marginRight: 10,
  },
  outcomeText: { color: '#374151', fontWeight: '700' },
  outcomeTextActive: { color: '#FFF' },
  approved: { backgroundColor: '#10B981', borderColor: '#10B981' },
  rejected: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14 },
});
