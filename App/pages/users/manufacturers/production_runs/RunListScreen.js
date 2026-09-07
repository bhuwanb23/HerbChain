/**
 * Manufacturing Run List — planned / in_progress / completed runs.
 *
 * Backend: GET /api/v1/manufacturing/batches?status=
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturingAPI } from '../../../../services/apiClient';

const TABS = ['all', 'planned', 'in_progress', 'completed'];
const STATUS_COLORS = { planned: '#F59E0B', in_progress: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' };

export default function RunListScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await ManufacturingAPI.listBatches(accessToken);
      setRuns(data.runs || []);
    } catch (err) {
      console.error('[RunList]', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === 'all' ? runs : runs.filter((r) => r.status === tab);

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || '#6B7280';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RunDetail', { runId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.code}>{item.run_code || item.id?.slice(0, 8)}</Text>
          <View style={[styles.badge, { backgroundColor: sc + '20' }]}>
            <Text style={[styles.badgeText, { color: sc }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.meta}>Product: {item.product?.name || item.product_id?.slice(0, 8) || '—'}</Text>
        <Text style={styles.meta}>Planned: {item.planned_units} units {item.produced_units ? `· Produced: ${item.produced_units}` : ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manufacturing Runs</Text>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all' ? 'All' : t.replace('_', ' ')} ({t === 'all' ? runs.length : runs.filter((r) => r.status === t).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No manufacturing runs.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#F97316' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: '#374151', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
