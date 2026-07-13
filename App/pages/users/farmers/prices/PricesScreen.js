/**
 * Price discovery — current market price per AYUSH species, sortable.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { PricesAPI } from '../../../../services/apiClient';

const SORTS = [
  { id: 'name', label: 'Name' },
  { id: 'price_asc', label: 'Price ↑' },
  { id: 'price_desc', label: 'Price ↓' },
  { id: 'recent', label: 'Recent' },
];

export default function PricesScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('name');

  const load = useCallback(async () => {
    try {
      const data = await PricesAPI.list(accessToken);
      setRows(data.prices || []);
    } catch (err) {
      Alert.alert('Could not load prices', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase();
    let r = lower
      ? rows.filter(
          (x) =>
            (x.common_name || '').toLowerCase().includes(lower) ||
            (x.scientific_name || '').toLowerCase().includes(lower),
        )
      : rows.slice();
    if (sort === 'price_asc') r.sort((a, b) => (a.price_per_kg_inr || 0) - (b.price_per_kg_inr || 0));
    else if (sort === 'price_desc') r.sort((a, b) => (b.price_per_kg_inr || 0) - (a.price_per_kg_inr || 0));
    else if (sort === 'recent') {
      r.sort((a, b) => (b.effective_at || '').localeCompare(a.effective_at || ''));
    } else {
      r.sort((a, b) => (a.common_name || '').localeCompare(b.common_name || ''));
    }
    return r;
  }, [rows, q, sort]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Market Prices</Text>
        <Text style={styles.subtitle}>{rows.length} species · admin-curated quotes</Text>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          style={styles.input}
          value={q}
          onChangeText={setQ}
          placeholder="Search species…"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sort, sort === s.id && styles.sortActive]}
            onPress={() => setSort(s.id)}
          >
            <Text style={[styles.sortText, sort === s.id && styles.sortTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.species_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#10B981"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbInitial}>{item.common_name?.[0] || '?'}</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.common_name}</Text>
                <Text style={styles.sci}>{item.scientific_name}</Text>
                <Text style={styles.meta}>
                  {item.source} · {item.effective_at?.slice(0, 10)}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.price}>₹{item.price_per_kg_inr}</Text>
                <Text style={styles.priceUnit}>/kg</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 24 }}>
              No prices match.
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomColor: '#E5E7EB', borderBottomWidth: 1 },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#065F46' },
  subtitle: { color: '#6B7280', fontSize: 12 },
  toolbar: { padding: 12 },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  sortRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  sort: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#E5E7EB' },
  sortActive: { backgroundColor: '#10B981' },
  sortText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  sortTextActive: { color: '#FFF' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    alignItems: 'center',
  },
  thumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#ECFDF5' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: '#065F46', fontWeight: '700' },
  name: { fontWeight: '700', color: '#111827', fontSize: 14 },
  sci: { color: '#6B7280', fontSize: 12, fontStyle: 'italic' },
  meta: { color: '#9CA3AF', fontSize: 10, marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontWeight: '700', color: '#065F46', fontSize: 18 },
  priceUnit: { color: '#6B7280', fontSize: 11 },
});
