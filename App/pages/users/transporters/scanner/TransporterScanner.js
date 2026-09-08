/**
 * TransporterScanner — the core ownership-transfer screen.
 *
 * Flow: Scan QR → Validate → Show confirmation → Execute transfer → Show new QR
 * Uses the existing ScanQrSheet component for camera + manual entry.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import ScanQrSheet from '../../../../components/ScanQrSheet';
import { TransfersAPI, BatchesAPI, QrAPI } from '../../../../services/apiClient';
import { useAuth } from '../../../../contexts/AuthContext';

export default function TransporterScanner({ navigation }) {
  const { accessToken, user } = useAuth();
  const [view, setView] = useState('scan'); // scan | confirming | success | error
  const [busy, setBusy] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [newQr, setNewQr] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualToken, setManualToken] = useState('');

  const handleScanned = useCallback(async (token) => {
    if (!token?.trim() || busy) return;
    setBusy(true);
    setErrorMsg('');

    try {
      // Step 1: Look up the batch by QR token
      const batchRes = await BatchesAPI.resolve(accessToken, token.trim());
      const batch = batchRes?.batch || batchRes;

      if (!batch) {
        setErrorMsg('No batch found for this QR code.');
        setView('error');
        setBusy(false);
        return;
      }

      // Step 2: Initiate transfer request
      const transferRes = await TransfersAPI.initiate(accessToken, {
        batch_id: batch.id,
        qr_token: token.trim(),
      });

      const transfer = transferRes?.transfer || transferRes;

      if (!transfer) {
        setErrorMsg('Could not initiate transfer. The QR may be inactive or you may not be authorized.');
        setView('error');
        setBusy(false);
        return;
      }

      setTransferData({
        transfer,
        batch,
        qrToken: token.trim(),
      });
      setView('confirming');
    } catch (err) {
      const msg = err?.message || 'Failed to validate QR code.';
      if (msg.includes('deactivated') || msg.includes('inactive')) {
        setErrorMsg('This QR code has been deactivated. Ask the sender for a new one.');
      } else if (msg.includes('unauthorized') || msg.includes('not authorized')) {
        setErrorMsg('You are not authorized to receive this transfer.');
      } else {
        setErrorMsg(msg);
      }
      setView('error');
    }
    setBusy(false);
  }, [accessToken, busy]);

  const confirmTransfer = useCallback(async () => {
    if (!transferData || busy) return;
    setBusy(true);

    try {
      // Step 3: Confirm the transfer
      const result = await TransfersAPI.approve(accessToken, transferData.transfer.id);
      const approved = result?.transfer || result;

      // Step 4: Get the new QR token
      const qrRes = await QrAPI.active(accessToken, transferData.batch.id);
      const qr = qrRes?.qr || qrRes;

      setNewQr(qr);
      setView('success');
    } catch (err) {
      Alert.alert('Transfer Failed', err?.message || 'Please try again.');
      setView('scan');
    }
    setBusy(false);
  }, [transferData, accessToken, busy]);

  const resetScanner = () => {
    setView('scan');
    setTransferData(null);
    setNewQr(null);
    setErrorMsg('');
    setManualToken('');
  };

  // ─── Scan view ───
  if (view === 'scan') {
    return (
      <ScanQrSheet
        title="Scan Batch QR"
        helperText="Point at the QR code on the batch package, or paste the token below."
        onScanned={handleScanned}
        onCancel={() => navigation.goBack()}
        busy={busy}
      />
    );
  }

  // ─── Confirming view ───
  if (view === 'confirming' && transferData) {
    const { batch, transfer } = transferData;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Transfer Confirmation</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Batch" value={batch.batch_code || batch.id} />
          <InfoRow label="Species" value={batch.species?.common_name || batch.species_name || '-'} />
          <InfoRow label="Weight" value={`${batch.weight_kg || batch.weight || '-'} kg`} />
          <InfoRow label="From" value={transfer.from_user?.full_name || transfer.from_name || 'Previous owner'} />
          <InfoRow label="To" value={user?.full_name || 'You'} />
          <InfoRow label="QR Token" value={transferData.qrToken} mono />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetScanner} disabled={busy}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, busy && styles.btnDisabled]}
            onPress={confirmTransfer}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Success view ───
  if (view === 'success') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successHeader}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Transfer Complete!</Text>
          <Text style={styles.successSub}>You are now the owner of this batch.</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Batch" value={transferData?.batch?.batch_code || '-'} />
          <InfoRow label="Old QR" value={transferData?.qrToken || '-'} strikethrough />
          <InfoRow label="New QR" value={newQr?.token || newQr?.qr_token || '-'} highlight />
        </View>

        {newQr && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>New QR Token</Text>
            <View style={styles.qrBox}>
              <Text style={styles.qrToken}>{newQr?.token || newQr?.qr_token}</Text>
            </View>
            <Text style={styles.qrHint}>Show this QR to the next recipient</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('BatchDetail', { batchId: transferData?.batch?.id })}>
            <Text style={styles.secondaryBtnText}>View Batch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={resetScanner}>
            <Text style={styles.confirmBtnText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Error view ───
  if (view === 'error') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.errorHeader}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Scan Failed</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.confirmBtn} onPress={resetScanner}>
            <Text style={styles.confirmBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return null;
}

function InfoRow({ label, value, mono, strikethrough, highlight }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          mono && styles.mono,
          strikethrough && styles.strikethrough,
          highlight && styles.highlight,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  card: { backgroundColor: '#FFF', margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  mono: { fontFamily: 'monospace', fontSize: 12 },
  strikethrough: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  highlight: { color: '#059669' },
  actionRow: { flexDirection: 'row', gap: 12, margin: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  cancelBtnText: { fontSize: 16, color: '#374151', fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, color: '#FFF', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  secondaryBtnText: { fontSize: 16, color: '#3B82F6', fontWeight: '700' },
  successHeader: { alignItems: 'center', padding: 32, backgroundColor: '#D1FAE5' },
  successIcon: { fontSize: 48, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 14, color: '#059669', marginTop: 4 },
  errorHeader: { alignItems: 'center', padding: 32, backgroundColor: '#FEE2E2' },
  errorIcon: { fontSize: 48, marginBottom: 8 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#991B1B' },
  errorMsg: { fontSize: 14, color: '#B91C1C', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  qrContainer: { alignItems: 'center', margin: 12 },
  qrLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  qrBox: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#059669', borderRadius: 12, padding: 20, minWidth: 200, alignItems: 'center' },
  qrToken: { fontSize: 16, fontFamily: 'monospace', fontWeight: '700', color: '#065F46' },
  qrHint: { fontSize: 12, color: '#6B7280', marginTop: 8 },
});
