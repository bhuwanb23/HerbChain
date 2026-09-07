/**
 * Product Lineage — backward trace showing product → manufacturing run → ingredient batches → farmers.
 *
 * Backend: GET /api/v1/products/:id/lineage
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ProductsAPI } from '../../../../services/apiClient';

export default function ProductLineageScreen({ route }) {
  const { accessToken } = useAuth();
  const { productId } = route.params;
  const [lineage, setLineage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await ProductsAPI.lineage(accessToken, productId);
        setLineage(data);
      } catch (err) {
        console.error('[Lineage]', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, productId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#F97316" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!lineage) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No lineage data available.</Text>
      </View>
    );
  }

  const product = lineage.product || lineage;
  const ingredients = lineage.ingredients || [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Product Lineage</Text>
      <Text style={styles.subtitle}>Backward trace: product → batches → farmers</Text>

      {/* Product node */}
      <View style={[styles.node, styles.productNode]}>
        <Text style={styles.nodeLabel}>📦 Product</Text>
        <Text style={styles.nodeTitle}>{product.name || product.code || productId}</Text>
        <Text style={styles.nodeMeta}>{product.category || '—'} · {product.code || '—'}</Text>
      </View>

      <View style={styles.connector} />

      {/* Manufacturing run */}
      <View style={[styles.node, styles.runNode]}>
        <Text style={styles.nodeLabel}>🏭 Manufacturing Run</Text>
        <Text style={styles.nodeTitle}>{product.run_code || lineage.run_code || '—'}</Text>
        <Text style={styles.nodeMeta}>{product.planned_units || lineage.planned_units || '—'} units planned</Text>
      </View>

      <View style={styles.connector} />

      {/* Ingredient batches */}
      <Text style={styles.sectionTitle}>Ingredient Batches ({ingredients.length})</Text>
      {ingredients.map((ing, i) => (
        <React.Fragment key={ing.batch_id || i}>
          <View style={[styles.node, styles.batchNode]}>
            <Text style={styles.nodeLabel}>🌿 Batch {i + 1}</Text>
            <Text style={styles.nodeTitle}>{ing.batch_code || ing.batch_id?.slice(0, 8) || '—'}</Text>
            <Text style={styles.nodeMeta}>
              {ing.species?.common_name || '—'} · {ing.quantity_kg || '—'} kg
            </Text>
            {ing.lab_certified && <Text style={styles.certBadge}>✓ Lab Certified</Text>}
          </View>

          <View style={styles.connector} />

          {/* Farmer */}
          <View style={[styles.node, styles.farmerNode]}>
            <Text style={styles.nodeLabel}>👨‍🌾 Farmer</Text>
            <Text style={styles.nodeTitle}>{ing.farmer_name || ing.farmer_id || '—'}</Text>
            <Text style={styles.nodeMeta}>{ing.farmer_location || ing.location || '—'}</Text>
          </View>

          {i < ingredients.length - 1 && <View style={styles.connector} />}
        </React.Fragment>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  empty: { color: '#6B7280' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  node: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  productNode: { borderLeftWidth: 4, borderLeftColor: '#F97316' },
  runNode: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  batchNode: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  farmerNode: { borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  nodeLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  nodeTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
  nodeMeta: { fontSize: 13, color: '#374151', marginTop: 2 },
  certBadge: { fontSize: 12, color: '#059669', fontWeight: '700', marginTop: 4 },
  connector: { width: 2, height: 20, backgroundColor: '#D1D5DB', marginLeft: 20, marginVertical: 2 },
});
