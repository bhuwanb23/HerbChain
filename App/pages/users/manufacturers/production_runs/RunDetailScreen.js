/**
 * Manufacturing Run Detail — ingredients, status, start/complete/cancel actions.
 *
 * Backend: GET    /api/v1/manufacturing/batches/:id
 *          POST   /api/v1/manufacturing/batches/:id/start
 *          POST   /api/v1/manufacturing/batches/:id/complete
 *          POST   /api/v1/manufacturing/batches/:id/cancel
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturingAPI } from '../../../../services/apiClient';
import { QrTokenDisplay } from '../../../../components';

const STATUS_COLORS = { planned: '#F59E0B', in_progress: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };

export default function RunDetailScreen({ route }) {
  const { accessToken } = useAuth();
  const { runId } = route.params;
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [qrModal, setQrModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await ManufacturingAPI.getBatch(accessToken, runId);
      setRun(data.run);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, runId]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    setActing(true);
    try {
      await ManufacturingAPI.start(accessToken, runId);
      load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setActing(false);
    }
  };

  const handleComplete = async () => {
    Alert.alert('Complete Run', 'Mark this run as completed? This will consume inventory and mint a product QR.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setActing(true);
          try {
            const result = await ManufacturingAPI.complete(accessToken, runId, {});
            if (result.qr) {
              setQrModal(result.qr);
            }
            load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Run', 'This will release all reservations. Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setActing(true);
          try {
            await ManufacturingAPI.cancel(accessToken, runId, { reason: 'Cancelled by manufacturer' });
            load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          } finally {
            setActing(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#F97316" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  const r = run || {};
  const sc = STATUS_COLORS[r.status] || '#6B7280';
  const ingredients = r.ingredients || [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{r.run_code || r.id?.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: sc + '20' }]}>
          <Text style={[styles.badgeText, { color: sc }]}>{r.status}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="Product" value={r.product?.name || r.product_id?.slice(0, 8) || '—'} />
        <InfoRow label="Planned" value={`${r.planned_units} units`} />
        {r.produced_units && <InfoRow label="Produced" value={`${r.produced_units} units`} />}
        <InfoRow label="Created" value={r.created_at?.slice(0, 10) || '—'} />
        {r.notes && <InfoRow label="Notes" value={r.notes} />}
      </View>

      {/* Ingredients */}
      <Text style={styles.sectionTitle}>Ingredients ({ingredients.length})</Text>
      {ingredients.map((ing, i) => (
        <View key={ing.id || i} style={styles.ingredientCard}>
          <Text style={styles.ingredientTitle}>{ing.batch_code || ing.batch_id?.slice(0, 8)}</Text>
          <Text style={styles.ingredientMeta}>
            {ing.species?.common_name || '—'} · {ing.quantity_kg || '—'} kg
          </Text>
        </View>
      ))}

      {/* Actions */}
      {r.status === 'planned' && (
        <TouchableOpacity style={styles.primary} onPress={handleStart} disabled={acting}>
          {acting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Start Production</Text>}
        </TouchableOpacity>
      )}
      {r.status === 'in_progress' && (
        <TouchableOpacity style={styles.primary} onPress={handleComplete} disabled={acting}>
          {acting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Complete & Mint QR</Text>}
        </TouchableOpacity>
      )}
      {(r.status === 'planned' || r.status === 'in_progress') && (
        <TouchableOpacity style={styles.dangerBtn} onPress={handleCancel} disabled={acting}>
          <Text style={styles.dangerText}>Cancel Run</Text>
        </TouchableOpacity>
      )}

      {/* QR modal */}
      {qrModal && (
        <View style={styles.qrOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Product QR Minted</Text>
            <QrTokenDisplay token={qrModal.qr_token || qrModal.url} png={qrModal.qr_png} size={200} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModal(null)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
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
  value: { fontSize: 13, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 8 },
  ingredientCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#F97316' },
  ingredientTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  ingredientMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  dangerBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FCA5A5' },
  dangerText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  qrOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: '700', color: '#C2410C', marginBottom: 12 },
  closeBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#F97316', borderRadius: 10 },
  closeBtnText: { color: '#FFF', fontWeight: '700' },
});
