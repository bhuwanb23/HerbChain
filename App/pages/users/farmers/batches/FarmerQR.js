/**
 * FarmerQR — view and manage the active QR for a batch.
 *
 * Backend: GET /api/v1/batches/:id/qr, POST /api/v1/qr/regenerate
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { BatchesAPI, QrAPI } from '../../../services/apiClient';

export default function FarmerQR({ route }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    if (!batchId || !accessToken) return;
    try {
      setLoading(true);
      const data = await BatchesAPI.getQr(accessToken, batchId);
      setQr(data);
    } catch (err) {
      Alert.alert('No QR', err.message || 'This batch has no active QR.');
    } finally {
      setLoading(false);
    }
  }, [batchId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate QR',
      'This will invalidate the current QR and create a new one. The old QR will no longer work for transfers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              await QrAPI.regenerate(accessToken, batchId, 'Farmer requested regeneration');
              Alert.alert('Done', 'New QR generated. Show the new QR to the transporter.');
              await load();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to regenerate');
            } finally {
              setRegenerating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>;
  }

  if (!qr) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>No Active QR</Text>
        <Text style={styles.subtitle}>Register a batch first to get a QR code.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active QR</Text>
        <Text style={styles.subtitle}>Show this to the transporter</Text>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.batchCode}>{qr.code || batchId}</Text>

        {/* QR image placeholder */}
        <View style={styles.qrPlaceholder}>
          {qr.png || qr.qr?.png ? (
            <Text style={styles.qrImageText}>QR Image Available</Text>
          ) : (
            <Text style={styles.qrPlaceholderText}>📱 QR Code</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Version</Text>
          <Text style={styles.metaValue}>{qr.version || qr.qr?.version || '1'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={[styles.metaValue, { color: '#10B981' }]}>{qr.status || qr.qr?.status || 'active'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Token</Text>
          <Text style={[styles.metaValue, { fontSize: 10 }]} numberOfLines={1}>
            {qr.token || qr.qr?.token || '—'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.regenerateBtn, regenerating && { opacity: 0.6 }]}
        onPress={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <Text style={styles.regenerateText}>🔄 Regenerate QR</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footnote}>
        ⚠️ Regenerating will invalidate the current QR. Only do this if the current one is compromised.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  icon: { fontSize: 48, marginBottom: 12 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  qrCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginBottom: 16,
  },
  batchCode: { fontSize: 18, fontWeight: '700', color: '#065F46', marginBottom: 16 },
  qrPlaceholder: {
    width: 220, height: 220, backgroundColor: '#F3F4F6', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  qrPlaceholderText: { fontSize: 48 },
  qrImageText: { fontSize: 14, color: '#0EA5E9', fontWeight: '600' },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  metaLabel: { fontSize: 13, color: '#6B7280' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  regenerateBtn: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12,
  },
  regenerateText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  footnote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
});
