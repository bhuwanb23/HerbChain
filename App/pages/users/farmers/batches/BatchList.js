/**
 * BatchList — farmer's batch list with filter tabs.
 *
 * Backend: GET /api/v1/batches/mine
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { BatchesAPI } from '../../../services/apiClient';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'with_farmer', label: 'With You' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'at_lab', label: 'At Lab' },
  { key: 'consumed', label: 'Consumed' },
];

const PHASE_COLORS = {
  with_farmer: '#10B981',
  in_transit_to_lab: '#F59E0B',
  in_transit_to_manufacturer: '#F59E0B',
  at_lab: '#8B5CF6',
  with_manufacturer: '#0EA5E9',
  consumed: '#6B7280',
};

export default function BatchList({ navigation }) {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await BatchesAPI.listMine(accessToken, { limit: 100 });
      setBatches(data.batches || []);
    } catch (err) {
      console.log('Failed to load batches', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? batches
    : batches.filter((b) => {
        if (filter === 'in_transit') return b.phase?.includes('transit');
        if (filter === 'with_farmer') return b.phase === 'with_farmer';
        if (filter === 'at_lab') return b.phase === 'at_lab';
        if (filter === 'consumed') return b.phase === 'consumed';
        return true;
      });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Batches</Text>
        <Text style={styles.count}>{batches.length} total</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Batch list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No batches found</Text>
            <Text style={styles.emptyText}>Register your first harvest to get started.</Text>
          </View>
        ) : (
          filtered.map((b) => {
            const color = PHASE_COLORS[b.phase] || '#6B7280';
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.card}
                onPress={() => navigation?.navigate?.('BatchDetail', { batchId: b.id })}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.phaseDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.species?.common_name || b.species?.code || 'Unknown'}</Text>
                    <Text style={styles.cardCode}>{b.code}</Text>
                  </View>
                  <Text style={[styles.phaseText, { color }]}>{b.phase?.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {b.weight_kg} kg · {b.harvest_date ? new Date(b.harvest_date).toLocaleDateString() : '—'} · {b.location || '—'}
                </Text>
                <View style={styles.cardBottom}>
                  <Text style={[styles.testBadge, { backgroundColor: b.test_status === 'approved' ? '#D1FAE5' : '#FEF3C7', color: b.test_status === 'approved' ? '#065F46' : '#92400E' }]}>
                    {b.test_status || 'pending'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 13, color: '#6B7280' },
  filterRow: { paddingHorizontal: 12, paddingBottom: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#FFF' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardCode: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  phaseText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  testBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  chevron: { fontSize: 20, color: '#D1D5DB' },
});
