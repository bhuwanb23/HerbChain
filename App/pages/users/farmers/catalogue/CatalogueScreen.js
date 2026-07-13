/**
 * Searchable browser for the AYUSH herb catalogue.
 *
 * Backed by GET /api/v1/catalogue.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { CatalogueAPI } from '../../../../services/apiClient';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'ayurveda', label: 'Ayurveda' },
  { id: 'unani', label: 'Unani' },
  { id: 'siddha', label: 'Siddha' },
];

export default function CatalogueScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CatalogueAPI.list(accessToken, { q, category });
      setItems(data.species || []);
    } catch (err) {
      Alert.alert('Could not load catalogue', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, q, category]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => items, [items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AYUSH Herb Catalogue</Text>
        <Text style={styles.subtitle}>{items.length} species</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search common, scientific, or synonym…"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={load}
        />
      </View>
      <View style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id || 'all'}
            style={[styles.cat, category === c.id && styles.catActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={[styles.catText, category === c.id && styles.catTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.species_id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CatalogueDetail', { speciesId: item.species_id })}
            >
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
                {item.synonyms?.length > 0 && (
                  <Text style={styles.syns}>{item.synonyms.slice(0, 3).join(' · ')}</Text>
                )}
                {item.default_unit_price_inr != null && (
                  <Text style={styles.price}>~ ₹{item.default_unit_price_inr}/kg</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No species match your filters.</Text>
            </View>
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
  searchRow: { padding: 12 },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  catRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  cat: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#E5E7EB' },
  catActive: { backgroundColor: '#10B981' },
  catText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  catTextActive: { color: '#FFF' },
  center: { padding: 32, alignItems: 'center' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#ECFDF5' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { color: '#065F46', fontWeight: '700', fontSize: 24 },
  name: { fontWeight: '700', color: '#111827', fontSize: 16 },
  sci: { color: '#6B7280', fontStyle: 'italic', fontSize: 12 },
  syns: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  price: { color: '#065F46', fontWeight: '700', marginTop: 4 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
