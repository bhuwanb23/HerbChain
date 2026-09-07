/**
 * Certified Herb Marketplace — browse lab-certified batches available for procurement.
 *
 * Backend: GET /api/v1/manufacturer/certified-batches?species=&min_available=&limit=
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI } from '../../../../services/apiClient';

const STATUS_COLORS = {
  certified: '#10B981',
  in_transit: '#F59E0B',
  pending: '#6B7280',
};

export default function MarketplaceScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await ManufacturerAPI.marketplace(accessToken, {
        species: filterSpecies || undefined,
        limit: 50,
      });
      setBatches(data.batches || []);
    } catch (err) {
      console.error('[Marketplace]', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, filterSpecies]);

  useEffect(() => { load(); }, [load]);

  const filtered = batches.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.species?.common_name || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q) ||
      (b.farmer_name || '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BatchDossier', { batchId: item.id, batch: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.species}>{item.species?.common_name || item.species?.code || 'Unknown'}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }]}>
          <Text style={styles.badgeText}>{item.status || 'certified'}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {item.code} · {item.weight_kg || item.available_kg || '?'} kg available
      </Text>
      <Text style={styles.sub}>
        Farmer: {item.farmer_name || item.farmer_id || '—'} · Lab: {item.lab_name || '—'}
      </Text>
      {item.certification_level && (
        <Text style={styles.cert}>Cert: {item.certification_level}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Certified Marketplace</Text>
      <Text style={styles.subtitle}>Browse lab-tested batches available for procurement</Text>

      <TextInput
        style={styles.search}
        placeholder="Search species, code, farmer..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {['', 'tulsi', 'ashwagandha', 'turmeric', 'neem'].map((sp) => (
          <TouchableOpacity
            key={sp || 'all'}
            style={[styles.filterChip, filterSpecies === sp && styles.filterChipActive]}
            onPress={() => setFilterSpecies(sp)}
          >
            <Text style={[styles.filterText, filterSpecies === sp && styles.filterTextActive]}>
              {sp || 'All'}
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
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          ListEmptyComponent={
            <Text style={styles.empty}>No certified batches found.</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  search: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#111827', marginBottom: 8,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#F97316' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#FFF' },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  species: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: '#374151', marginTop: 4 },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cert: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
