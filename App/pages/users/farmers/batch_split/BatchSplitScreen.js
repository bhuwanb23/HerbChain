/**
 * Batch split screen — split a held with_farmer batch into multiple children.
 *
 * Flow:
 *   1. Pick one of my held batches (phase = with_farmer*).
 *   2. Add N child rows, each with weight_kg + optional note.
 *   3. POST /api/v1/batches/<id>/split, show child QRs.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { BatchesAPI } from '../../../../services/apiClient';

const SPLITTABLE_PHASES = new Set(['with_farmer', 'with_farmer_after_lab']);

export default function BatchSplitScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [children, setChildren] = useState([{ weight_kg: '', note: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await BatchesAPI.listMine(accessToken);
      const splittable = (data.batches || []).filter((b) =>
        SPLITTABLE_PHASES.has(b.state?.phase),
      );
      setBatches(splittable);
    } catch (err) {
      Alert.alert('Could not load batches', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const totalKg = useMemo(
    () =>
      children.reduce((sum, c) => {
        const v = Number(c.weight_kg);
        return Number.isFinite(v) ? sum + v : sum;
      }, 0),
    [children],
  );

  const submit = async () => {
    if (!picked) return;
    const parentKg = Number(picked.herb?.weight_kg || 0);
    if (totalKg <= 0) {
      Alert.alert('Add weights', 'Add at least one child with weight > 0.');
      return;
    }
    if (totalKg > parentKg + 0.0001) {
      Alert.alert('Too much', `Sum (${totalKg} kg) exceeds parent (${parentKg} kg).`);
      return;
    }
    setSubmitting(true);
    try {
      const out = await BatchesAPI.split(accessToken, picked.herb.batch_id, {
        splits: children
          .filter((c) => Number(c.weight_kg) > 0)
          .map((c) => ({
            weight_kg: Number(c.weight_kg),
            note: c.note?.trim() || undefined,
          })),
      });
      setResult(out);
    } catch (err) {
      Alert.alert('Split failed', err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split a batch</Text>
        <Text style={styles.subtitle}>Only batches you hold in farmer phase</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!picked ? (
          batches.length === 0 ? (
            <Text style={styles.muted}>
              No splittable batches. Register one first or take it back after lab approval.
            </Text>
          ) : (
            batches.map((b) => (
              <TouchableOpacity
                key={b.herb.batch_id}
                style={styles.batch}
                onPress={() => setPicked(b)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.batchTitle}>
                    {b.herb.species_name} · {b.herb.weight_kg} kg
                  </Text>
                  <Text style={styles.batchMeta}>
                    {b.herb.batch_id} · {b.state?.phase}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          <View>
            <Text style={styles.section}>Parent batch</Text>
            <View style={styles.batchCard}>
              <Text style={styles.batchTitle}>
                {picked.herb.species_name} · {picked.herb.weight_kg} kg
              </Text>
              <Text style={styles.batchMeta}>{picked.herb.batch_id}</Text>
              <TouchableOpacity onPress={() => setPicked(null)}>
                <Text style={styles.link}>Change…</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.section}>Children ({children.length})</Text>
            {children.map((c, idx) => (
              <View key={idx} style={styles.childCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={c.weight_kg}
                    onChangeText={(t) =>
                      setChildren((arr) => arr.map((x, i) => (i === idx ? { ...x, weight_kg: t } : x)))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.label}>Note (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={c.note}
                    onChangeText={(t) =>
                      setChildren((arr) => arr.map((x, i) => (i === idx ? { ...x, note: t } : x)))
                    }
                    placeholder="Buyer name, lot, etc."
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {children.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setChildren((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <Text style={[styles.link, { color: '#DC2626' }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setChildren((arr) => [...arr, { weight_kg: '', note: '' }])}
            >
              <Text style={styles.secondaryText}>+ Add another child</Text>
            </TouchableOpacity>

            <View style={styles.totalRow}>
              <Text style={styles.total}>
                Total {totalKg.toFixed(2)} / {picked.herb.weight_kg} kg
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primary, submitting && { opacity: 0.7 }]}
              onPress={submit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryText}>Confirm split</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(result)}
        animationType="slide"
        onRequestClose={() => {
          setResult(null);
          setPicked(null);
          setChildren([{ weight_kg: '', note: '' }]);
          load();
        }}
      >
        <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>Split complete</Text>
          {result && (
            <>
              <Text style={styles.muted}>
                Parent {result.parent_batch_id} · remaining {result.parent_remaining_kg} kg{' '}
                {result.parent_consumed ? '(consumed)' : '(still held by you)'}
              </Text>
              {result.children.map((c) => (
                <View key={c.batch_id} style={styles.childResult}>
                  <Text style={styles.batchTitle}>
                    {c.batch_id} · {c.weight_kg} kg
                  </Text>
                  {c.note ? <Text style={styles.batchMeta}>{c.note}</Text> : null}
                  {c.qr_png && (
                    <Image source={{ uri: c.qr_png }} style={{ width: 220, height: 220, alignSelf: 'center' }} />
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.primary}
                onPress={() => {
                  setResult(null);
                  setPicked(null);
                  setChildren([{ weight_kg: '', note: '' }]);
                  load();
                }}
              >
                <Text style={styles.primaryText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#065F46' },
  subtitle: { color: '#6B7280', fontSize: 12 },
  muted: { color: '#6B7280', textAlign: 'center', padding: 16 },
  section: { fontWeight: '700', color: '#065F46', marginTop: 8, marginBottom: 8 },
  batch: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  batchTitle: { fontWeight: '700', color: '#111827' },
  batchMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  batchCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  link: { color: '#10B981', textDecorationLine: 'underline', marginTop: 6 },
  label: { fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  childCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  primary: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondary: {
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryText: { color: '#10B981', fontWeight: '700' },
  totalRow: { marginTop: 12, alignItems: 'flex-end' },
  total: { color: '#065F46', fontWeight: '700' },
  childResult: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
