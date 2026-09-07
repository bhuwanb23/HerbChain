/**
 * Product List — manufacturer's products with status, SKU, category.
 *
 * Backend: GET /api/v1/products?status=
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ProductsAPI } from '../../../../services/apiClient';

const STATUS_COLORS = { active: '#10B981', draft: '#F59E0B', archived: '#6B7280' };

export default function ProductListScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await ProductsAPI.list(accessToken);
      setProducts(data.products || []);
    } catch (err) {
      console.error('[ProductList]', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || '#6B7280';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: sc + '20' }]}>
            <Text style={[styles.badgeText, { color: sc }]}>{item.status || 'active'}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{item.code || '—'} · {item.category || 'other'}</Text>
        {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ProductCreate')}>
          <Text style={styles.addText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No products yet. Create your first product.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  addBtn: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: '#374151', marginTop: 4 },
  sku: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
