/**
 * Catalogue detail — full info for one species + latest price.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { CatalogueAPI } from '../../../../services/apiClient';

export default function CatalogueDetailScreen({ route, navigation }) {
  const { speciesId } = route.params || {};
  const { accessToken } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await CatalogueAPI.get(accessToken, speciesId);
        if (!cancelled) setItem(data.species);
      } catch (err) {
        Alert.alert('Could not load species', err?.message || 'Network error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, speciesId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#6B7280' }}>Species not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroFallback]}>
          <Text style={{ color: '#065F46', fontWeight: '700' }}>{item.common_name}</Text>
        </View>
      )}
      <View style={{ padding: 16 }}>
        <Text style={styles.name}>{item.common_name}</Text>
        <Text style={styles.sci}>{item.scientific_name}</Text>
        <View style={styles.chips}>
          <Text style={styles.chip}>{item.ayush_category}</Text>
          {item.season_planting && (
            <Text style={styles.chip}>Plant: {item.season_planting}</Text>
          )}
          {item.season_harvest && (
            <Text style={styles.chip}>Harvest: {item.season_harvest}</Text>
          )}
        </View>

        {item.latest_price && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Latest market price</Text>
            <Text style={styles.priceValue}>
              ₹{item.latest_price.price_per_kg_inr}/kg
            </Text>
            <Text style={styles.priceMeta}>
              source: {item.latest_price.source} ·{' '}
              {new Date(item.latest_price.effective_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {item.description && (
          <>
            <Text style={styles.sectionHead}>About</Text>
            <Text style={styles.body}>{item.description}</Text>
          </>
        )}
        {item.medicinal_uses && (
          <>
            <Text style={styles.sectionHead}>Medicinal uses</Text>
            <Text style={styles.body}>{item.medicinal_uses}</Text>
          </>
        )}
        {item.synonyms?.length > 0 && (
          <>
            <Text style={styles.sectionHead}>Also known as</Text>
            <Text style={styles.body}>{item.synonyms.join(' · ')}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { padding: 16, backgroundColor: '#FFF' },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  hero: { width: '100%', height: 220 },
  heroFallback: { backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: '#111827' },
  sci: { fontStyle: 'italic', color: '#6B7280', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  chip: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '600',
    fontSize: 12,
  },
  priceBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 8,
  },
  priceLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  priceValue: { color: '#065F46', fontWeight: '700', fontSize: 24, marginTop: 4 },
  priceMeta: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  sectionHead: { fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 4 },
  body: { color: '#374151', lineHeight: 20 },
});
