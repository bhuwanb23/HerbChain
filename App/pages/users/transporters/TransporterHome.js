/**
 * Transporter v1 home — scan a QR to pick up / hand off a batch.
 *
 * Backed by:
 *     GET  /api/v1/batches/mine
 *     POST /api/v1/batches/<id>/transfer   { scanned_qr_token, location }
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { QrTokenDisplay, RoleHomeShell, ScanQrSheet } from '../../../components';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, BatchesAPI, QrAPI, ShipmentsAPI } from '../../../services/apiClient';

const PHASE_LABEL = {
  in_transit_to_lab: 'In transit to lab',
  in_transit_to_manufacturer: 'In transit to manufacturer',
};

export default function TransporterHome() {
  const { accessToken, user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [resultModal, setResultModal] = useState(null);

  const load = useCallback(async () => {
    try {
      // A transporter's custody view = batches currently held by them (from a
      // scan-to-receive) plus their assigned shipments (P7).
      const [mine, shipments] = await Promise.all([
        BatchesAPI.listMine(accessToken),
        ShipmentsAPI.list(accessToken, { role: 'transporter' }).catch(() => ({ shipments: [] })),
      ]);
      setBatches(mine.batches || []);
      setShipments(shipments.shipments || []);
    } catch (err) {
      Alert.alert('Could not load trips', err?.message || 'Network error');
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
      // P5/P6 two-party transfer: validate the token, then execute the
      // custody transfer against it (moves batch + rotates QR atomically).
      const validated = await QrAPI.validate(accessToken, token);
      if (!validated.valid) {
        Alert.alert('Invalid QR', validated.message || 'This QR is not active.');
        return;
      }
      const result = await QrAPI.transfer(accessToken, token);
      setScanOpen(false);
      setResultModal({
        batch_id: result.batch_id,
        code: result.code,
        from_phase: result.phase_before,
        to_phase: result.phase_after,
        new_qr_url: result.url,
        new_qr_png: result.png,
      });
      await load();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err?.message || 'Transfer failed';
      Alert.alert('Could not transfer', msg);
    } finally {
      setScanning(false);
    }
  };

  return (
    <RoleHomeShell
      title="Pickups & deliveries"
      subtitle="Scan a QR to pick up; scan again to hand off"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <TouchableOpacity style={styles.primary} onPress={() => setScanOpen(true)}>
        <Text style={styles.primaryText}>Scan QR</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Currently in your hands</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0EA5E9" />
        </View>
      ) : batches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing currently in transit.</Text>
        </View>
      ) : (
        batches.map((b) => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{b.species?.common_name || b.species?.code || 'Unknown'}</Text>
              <Text style={styles.cardId}>{b.code}</Text>
            </View>
            <Text style={styles.cardMeta}>
              {b.weight_kg} kg · {b.location || '—'}
            </Text>
            <Text style={styles.phase}>
              {PHASE_LABEL[b.phase] || b.phase}
            </Text>
          </View>
        ))
      )}

      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <ScanQrSheet
          title="Scan to pick up / deliver"
          helperText="Point at the package QR. The system will work out whether this is a pickup or a delivery."
          onScanned={handleScan}
          onCancel={() => setScanOpen(false)}
          busy={scanning}
        />
      </Modal>

      <Modal
        visible={Boolean(resultModal)}
        animationType="fade"
        transparent
        onRequestClose={() => setResultModal(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.qrCard}>
            {resultModal ? (
              <>
                <Text style={styles.title}>Transfer succeeded</Text>
                <Text style={styles.subtitle}>{resultModal.code || resultModal.batch_id}</Text>
                <Text style={styles.statusLine}>
                  {resultModal.from_phase} → {resultModal.to_phase}
                </Text>
                <QrTokenDisplay
                  token={resultModal.new_qr_url}
                  png={resultModal.new_qr_png}
                  label="Show this QR to the next handler"
                  size={220}
                />
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => setResultModal(null)}
                >
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </RoleHomeShell>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 8 },
  center: { alignItems: 'center', padding: 32 },
  empty: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  cardId: { fontSize: 11, color: '#9CA3AF' },
  cardMeta: { color: '#374151', fontSize: 13, marginTop: 4 },
  phase: { color: '#0EA5E9', fontSize: 13, fontWeight: '600', marginTop: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 380 },
  title: { fontSize: 20, fontWeight: '700', color: '#0EA5E9', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  statusLine: {
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 12,
  },
});
