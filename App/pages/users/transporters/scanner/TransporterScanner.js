/**
 * TransporterScanner — receiver side of the two-party custody transfer.
 *
 * Backend flow (Phase 6):
 *   1. POST /qr/validate          -> inspect the scanned QR (valid/batch/owner)
 *   2. POST /transfers/request    -> receiver REQUESTS custody (holder approves)
 *   3. POST /transfers/execute    -> only succeeds once the holder approved
 *      (409 not_approved / transfer_not_requested while pending)
 *   4. The execute response carries the ROTATED QR (url + png).
 *
 * Uses the existing ScanQrSheet component for camera + manual entry.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ScanQrSheet from '../../../../components/ScanQrSheet';
import { TransfersAPI, QrAPI } from '../../../../services/apiClient';
import { useAuth } from '../../../../contexts/AuthContext';

export default function TransporterScanner({ navigation }) {
  const { accessToken, user } = useAuth();
  const [view, setView] = useState('scan'); // scan | confirming | pending | success | error
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null); // { validate, qrToken }
  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState('pending');
  const [transfer, setTransfer] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fail = useCallback((err, fallback) => {
    const code = err?.code;
    const msg = err?.message || fallback;
    if (code === 'qr_inactive' || code === 'qr_expired' || /inactive|expired/i.test(msg)) {
      setErrorMsg('This QR code is no longer active. Ask the holder to regenerate it.');
    } else if (code === 'self_transfer') {
      setErrorMsg('You already hold custody of this batch.');
    } else if (code === 'forbidden' || /receiver|not authorized|custodian/i.test(msg)) {
      setErrorMsg('You are not authorized to receive this transfer.');
    } else if (code === 'not_found') {
      setErrorMsg('QR token not recognised. Scan a valid batch QR.');
    } else {
      setErrorMsg(msg);
    }
    setView('error');
  }, []);

  // Step 1 — validate the scanned QR (read-only).
  const handleScanned = useCallback(async (token) => {
    if (!token?.trim() || busy) return;
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await QrAPI.validate(accessToken, token.trim());
      const v = res;
      if (!v?.valid) {
        setErrorMsg(v?.message || 'This QR code is not valid for transfer.');
        setView('error');
        return;
      }
      setStage({ validate: v, qrToken: token.trim() });
      setView('confirming');
    } catch (err) {
      fail(err, 'Failed to validate QR code.');
    }
    setBusy(false);
  }, [accessToken, busy, fail]);

  const runExecute = useCallback(async (qrToken, rid) => {
    const execRes = await TransfersAPI.execute(accessToken, qrToken, rid);
    const t = execRes?.transfer;
    if (!t) throw new Error('Transfer completed but no transfer payload was returned.');
    setTransfer(t);
    setView('success');
  }, [accessToken]);

  // Step 2 — request custody, then try to execute (succeeds only if approved).
  const confirmTransfer = useCallback(async () => {
    if (!stage || busy) return;
    setBusy(true);
    const batchId = stage.validate?.batch?.id;
    try {
      let request;
      try {
        const reqRes = await TransfersAPI.request(accessToken, { batch_id: batchId });
        request = reqRes?.request;
      } catch (err) {
        if (err?.code !== 'request_exists') throw err;
        // An earlier request already exists for this batch — reuse it.
        const listRes = await TransfersAPI.listRequests(accessToken, { limit: 50 });
        const items = listRes?.requests || [];
        request = items.find(
          (r) => r?.batch?.id === batchId && ['pending', 'approved'].includes(r?.status)
        );
        if (!request) throw err;
      }

      setRequestId(request.id);
      setRequestStatus(request.status);
      await runExecute(stage.qrToken, request.id);
    } catch (err) {
      if (err?.code === 'not_approved' || err?.code === 'transfer_not_requested') {
        // Two-party gate: the holder has not approved yet -> show pending.
        setView('pending');
      } else if (err?.code === 'rejected') {
        setErrorMsg('The holder rejected this transfer request.');
        setView('error');
      } else {
        fail(err, 'Could not start the transfer.');
      }
    }
    setBusy(false);
  }, [stage, busy, accessToken, runExecute, fail]);

  // Step 3 (pending) — check whether the holder approved yet, then execute.
  const checkStatus = useCallback(async () => {
    if (!stage || !requestId || busy) return;
    setBusy(true);
    try {
      const res = await TransfersAPI.getRequest(accessToken, requestId);
      const req = res?.request;
      setRequestStatus(req?.status || 'pending');
      if (req?.status === 'rejected') {
        setErrorMsg(req?.rejection_reason || 'The holder rejected this transfer request.');
        setView('error');
      } else if (req?.status === 'approved' || req?.status === 'completed') {
        await runExecute(stage.qrToken, requestId);
      }
      // still pending -> stay on the pending view
    } catch (err) {
      fail(err, 'Could not check the request status.');
    }
    setBusy(false);
  }, [stage, requestId, accessToken, busy, runExecute, fail]);

  const resetScanner = () => {
    setView('scan');
    setStage(null);
    setRequestId(null);
    setRequestStatus('pending');
    setTransfer(null);
    setErrorMsg('');
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
  if (view === 'confirming' && stage) {
    const v = stage.validate;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Transfer Request</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Batch" value={v.batch?.code || v.batch?.id || '-'} />
          <InfoRow label="Species" value={v.batch?.species?.common_name || '-'} />
          <InfoRow label="Phase" value={v.batch?.phase || '-'} />
          <InfoRow label="From" value={`${v.owner?.name || 'Holder'} (${v.owner?.role || '-'})`} />
          <InfoRow label="To" value={user?.name || 'You'} />
          <InfoRow label="QR Token" value={stage.qrToken} mono />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Submitting sends a custody request to the current holder. The transfer
            completes only after they approve it.
          </Text>
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
              <Text style={styles.confirmBtnText}>Request Custody</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Pending view (holder has not approved yet) ───
  if (view === 'pending' && stage) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.pendingHeader}>
          <Text style={styles.pendingIcon}>⏳</Text>
          <Text style={styles.pendingTitle}>Awaiting Holder Approval</Text>
          <Text style={styles.pendingSub}>
            {stage.validate?.owner?.name || 'The current holder'} must approve before
            custody moves to you.
          </Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Batch" value={stage.validate?.batch?.code || '-'} />
          <InfoRow label="Request" value={requestId || '-'} mono />
          <InfoRow label="Status" value={requestStatus} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetScanner} disabled={busy}>
            <Text style={styles.cancelBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, busy && styles.btnDisabled]}
            onPress={checkStatus}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmBtnText}>Check Status</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Success view ───
  if (view === 'success' && transfer) {
    const rawToken = typeof transfer.url === 'string'
      ? transfer.url.split('/qr/').pop()
      : null;
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successHeader}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Transfer Complete!</Text>
          <Text style={styles.successSub}>You are now the owner of this batch.</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Batch" value={transfer.code || '-'} />
          <InfoRow label="Phase" value={`${transfer.phase_before || '-'} → ${transfer.phase_after || '-'}`} />
          <InfoRow label="Old QR" value={stage?.qrToken || '-'} strikethrough />
          <InfoRow label="New QR" value={rawToken || transfer.token_prefix || '-'} highlight />
        </View>

        {rawToken && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>New QR Token</Text>
            <View style={styles.qrBox}>
              <Text style={styles.qrToken}>{rawToken}</Text>
            </View>
            <Text style={styles.qrHint}>Show this QR to the next recipient</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('BatchDetail', { batchId: transfer.batch_id })}
          >
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
  noticeCard: { backgroundColor: '#EFF6FF', marginHorizontal: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  noticeText: { color: '#1E40AF', fontSize: 13, lineHeight: 19 },
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
  pendingHeader: { alignItems: 'center', padding: 32, backgroundColor: '#FEF3C7' },
  pendingIcon: { fontSize: 48, marginBottom: 8 },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: '#92400E' },
  pendingSub: { fontSize: 14, color: '#B45309', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
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
