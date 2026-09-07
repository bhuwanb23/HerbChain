/**
 * LabQueue — lab batch queue with status filter tabs.
 *
 * Backend: GET /api/v1/labs/batches?status=…
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const TABS = [
  { key: 'pending_lab', label: 'Awaiting' },
  { key: 'in_testing', label: 'Testing' },
  { key: 'received', label: 'Received' },
  { key: 'all', label: 'All' },
];

const STATUS_COLORS = {
  pending_lab: '#F59E0B', in_testing: '#8B5CF6', received: '#10B981',
  at_lab: '#8B5CF6', certified: '#10B981', rejected: '#EF4444',
};

export default function LabQueue({ navigation }) {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState([]);
  const [tab, setTab] = useState('pending_lab');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await LabsAPI.queue(accessToken, { status: tab === 'all' ? undefined : tab });
      setBatches(Array.isArray(data) ? data : data?.batches || []);
    } catch (err) {
      console.log('Failed to load lab queue', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} />
        ) : batches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧪</Text>
            <Text style={styles.emptyTitle}>No batches</Text>
            <Text style={styles.emptyText}>Nothing in this queue right now.</Text>
          </View>
        ) : (
          batches.map((b) => {
            const color = STATUS_COLORS[b.phase || b.test_status] || '#6B7280';
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.card}
                onPress={() => navigation?.navigate?.('LabBatchDetail', { batchId: b.id })}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.species?.common_name || b.species?.code || 'Unknown'}</Text>
                    <Text style={styles.cardCode}>{b.code}</Text>
                  </View>
                  <Text style={[styles.badge, { backgroundColor: `${color}20`, color }]}>
                    {b.test_status || b.phase || '—'}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>
                  {b.weight_kg} kg · Farmer: {b.farmer?.name || '—'} · Samples: {b.sample_count || 0} · Tests: {b.test_count || 0}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabRow: { paddingHorizontal: 12, paddingVertical: 10 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8,
  },
  tabActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFF' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardCode: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 8 },
});
