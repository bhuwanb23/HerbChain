/**
 * BatchDetail — full detail view for a farmer's batch.
 *
 * Backend: GET /api/v1/batches/:id, GET /api/v1/batches/:id/history,
 *          GET /api/v1/batches/:id/qr
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { BatchesAPI } from '../../../services/apiClient';

const PHASE_COLORS = {
  with_farmer: '#10B981', in_transit_to_lab: '#F59E0B', at_lab: '#8B5CF6',
  with_manufacturer: '#0EA5E9', consumed: '#6B7280',
};

export default function BatchDetail({ route, navigation }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [batch, setBatch] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);

  const load = useCallback(async () => {
    if (!batchId || !accessToken) return;
    try {
      setLoading(true);
      const [b, h] = await Promise.all([
        BatchesAPI.get(accessToken, batchId),
        BatchesAPI.history(accessToken, batchId).catch(() => ({ events: [] })),
      ]);
      setBatch(b?.batch || b);
      setHistory(h?.events || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load batch');
    } finally {
      setLoading(false);
    }
  }, [batchId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const showQr = async () => {
    try {
      const data = await BatchesAPI.getQr(accessToken, batchId);
      setQrData(data);
    } catch (err) {
      Alert.alert('No QR', err.message || 'This batch has no active QR.');
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;
  }

  if (!batch) {
    return <View style={styles.center}><Text style={styles.empty}>Batch not found</Text></View>;
  }

  const phase = batch.phase || 'unknown';
  const color = PHASE_COLORS[phase] || '#6B7280';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Phase banner */}
      <View style={[styles.banner, { backgroundColor: `${color}15` }]}>
        <View style={[styles.phaseDot, { backgroundColor: color }]} />
        <Text style={[styles.phaseText, { color }]}>{phase.replace(/_/g, ' ')}</Text>
      </View>

      {/* Batch info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Batch Information</Text>
        <InfoRow label="Code" value={batch.code} />
        <InfoRow label="Species" value={batch.species?.common_name || batch.species?.code || '—'} />
        <InfoRow label="Weight" value={`${batch.weight_kg || '—'} kg`} />
        <InfoRow label="Harvest Date" value={batch.harvest_date ? new Date(batch.harvest_date).toLocaleDateString() : '—'} />
        <InfoRow label="Cultivation" value={batch.cultivation_type || '—'} />
        <InfoRow label="Location" value={batch.location || '—'} />
        <InfoRow label="GPS" value={batch.gps_lat && batch.gps_lng ? `${batch.gps_lat}, ${batch.gps_lng}` : '—'} />
        <InfoRow label="Test Status" value={batch.test_status || 'pending'} />
        <InfoRow label="Holder" value={batch.current_holder_user_id || '—'} />
      </View>

      {/* QR */}
      <TouchableOpacity style={styles.qrBtn} onPress={showQr}>
        <Text style={styles.qrBtnText}>📋 View Active QR</Text>
      </TouchableOpacity>

      {qrData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active QR</Text>
          <InfoRow label="Version" value={String(qrData.version || qrData.qr?.version || '—')} />
          <InfoRow label="Status" value={qrData.status || qrData.qr?.status || 'active'} />
          {qrData.png || qrData.qr?.png ? (
            <Text style={{ color: '#0EA5E9', marginTop: 8 }}>QR image available (show in modal)</Text>
          ) : null}
        </View>
      )}

      {/* Timeline */}
      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          {history.map((ev, i) => (
            <View key={ev.id || i} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineEvent}>{ev.event_type || ev.type}</Text>
                <Text style={styles.timelineTime}>{ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</Text>
                {ev.remarks && <Text style={styles.timelineRemarks}>{ev.remarks}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation?.navigate?.('FarmerQR', { batchId: batch.id })}
        >
          <Text style={styles.actionText}>Show QR to Transporter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
          onPress={() => navigation?.navigate?.('TransferRequests')}
        >
          <Text style={[styles.actionText, { color: '#EF4444' }]}>View Transfer Requests</Text>
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
  banner: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, marginBottom: 16,
  },
  phaseDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  phaseText: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#6B7280' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  qrBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#0EA5E9',
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12,
  },
  qrBtnText: { color: '#0EA5E9', fontWeight: '700', fontSize: 15 },
  timelineItem: { flexDirection: 'row', marginBottom: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  timelineEvent: { fontSize: 13, fontWeight: '600', color: '#111827' },
  timelineTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  timelineRemarks: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  actions: { marginTop: 8, gap: 10 },
  actionBtn: {
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  actionText: { color: '#065F46', fontWeight: '700', fontSize: 14 },
});
