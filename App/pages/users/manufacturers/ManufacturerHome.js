/**
 * Manufacturer v1 home — scan to receive, then create a product from received batches.
 *
 * Backed by:
 *     GET  /api/v1/batches/mine
 *     POST /api/v1/batches/<id>/transfer
 *     POST /api/v1/products
 *     GET  /api/v1/products/mine
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { QrTokenDisplay, RoleHomeShell, ScanQrSheet } from '../../../components';
import { useAuth } from '../../../contexts/AuthContext';
import { ApiError, BatchesAPI, ManufacturingAPI, ProductsAPI, QrAPI } from '../../../services/apiClient';

export default function ManufacturerHome() {
  const { accessToken, user } = useAuth();

  const [held, setHeld] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [creating, setCreating] = useState(false);

  const [productQrModal, setProductQrModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [mine, prods] = await Promise.all([
        BatchesAPI.listMine(accessToken),
        ProductsAPI.list(accessToken).catch(() => ({ products: [] })),
      ]);
      setHeld((mine.batches || []).filter((b) => b.phase === 'with_manufacturer'));
      setProducts(prods.products || []);
    } catch (err) {
      Alert.alert('Could not load data', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleScan = async (token) => {
    setScanning(true);
    try {
      const validated = await QrAPI.validate(accessToken, token);
      if (!validated.valid) {
        Alert.alert('Invalid QR', validated.message || 'This QR is not active.');
        return;
      }
      const batchId = validated.batch.id;
      const result = await QrAPI.transfer(accessToken, token);
      setScanOpen(false);
      await load();
      Alert.alert('Received', `${result.batch?.code || batchId} is now in your warehouse.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err?.message || 'Failed';
      Alert.alert('Could not receive', msg);
    } finally {
      setScanning(false);
    }
  };

  const toggleSelect = (batchId) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId],
    );
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Required', 'Product name is required.');
      return;
    }
    if (selectedBatchIds.length === 0) {
      Alert.alert('Pick batches', 'Select at least one source batch.');
      return;
    }
    setCreating(true);
    try {
      // P10 flow: create the product, then run a manufacturing batch over the
      // selected source batches; completing the run mints the consumer QR.
      const product = await ProductsAPI.create(accessToken, {
        name: productName.trim(),
        sku: productSku.trim() || undefined,
        category: 'other',
      });
      const ingredients = selectedBatchIds.map((id) => {
        const b = held.find((x) => x.id === id);
        return { batch_id: id, quantity_kg: Number(b?.weight_kg || 0) };
      });
      const run = await ManufacturingAPI.createBatch(accessToken, {
        product_id: product.product.id,
        planned_units: 1,
        ingredients,
      });
      const completed = await ManufacturingAPI.complete(accessToken, run.run.id, {});
      setCreateOpen(false);
      setSelectedBatchIds([]);
      setProductName('');
      setProductSku('');
      setProductQrModal({
        product_id: product.product.id,
        name: product.product.name,
        qr_token: completed.qr?.url || null,
        qr_png: completed.qr?.png || null,
      });
      await load();
    } catch (err) {
      Alert.alert('Could not create product', err?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <RoleHomeShell
      title="Production line"
      subtitle="Receive batches, package into products"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <TouchableOpacity style={styles.primary} onPress={() => setScanOpen(true)}>
        <Text style={styles.primaryText}>Scan incoming batch</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Held batches</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#F97316" />
        </View>
      ) : held.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No batches received yet.</Text>
        </View>
      ) : (
        held.map((b) => (
          <View key={b.id} style={styles.card}>
            <Text style={styles.cardTitle}>{b.species?.common_name || b.species?.code || 'Unknown'}</Text>
            <Text style={styles.cardMeta}>
              {b.code} · {b.weight_kg} kg
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.secondary, held.length === 0 && { opacity: 0.5 }]}
        disabled={held.length === 0}
        onPress={() => setCreateOpen(true)}
      >
        <Text style={styles.secondaryText}>Create product from these batches</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Your products</Text>
      {products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No products created yet.</Text>
        </View>
      ) : (
        products.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.card}
            onPress={async () => {
              try {
                const data = await ProductsAPI.get(accessToken, p.id);
                setProductQrModal({
                  product_id: p.id,
                  name: p.name,
                  qr_token: null,
                  qr_png: null,
                });
                console.log('[Manufacturer] product detail', data.product?.code);
              } catch (err) {
                Alert.alert('Could not load product', err?.message);
              }
            }}
          >
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.cardMeta}>
              {p.code || p.id} · {p.category || 'other'}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Scan modal */}
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <ScanQrSheet
          title="Scan batch QR"
          onScanned={handleScan}
          onCancel={() => setScanOpen(false)}
          busy={scanning}
        />
      </Modal>

      {/* Create product modal */}
      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create product</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Tulsi Wellness Tea"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>SKU (optional)</Text>
          <TextInput
            style={styles.input}
            value={productSku}
            onChangeText={setProductSku}
            placeholder="TWT-001"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Source batches</Text>
          {held.map((b) => {
            const selected = selectedBatchIds.includes(b.id);
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => toggleSelect(b.id)}
                style={[styles.batchSelect, selected && styles.batchSelectActive]}
              >
                <Text style={styles.batchSelectTitle}>
                  {selected ? '☑ ' : '☐ '} {b.species?.common_name || b.species?.code || 'Unknown'}
                </Text>
                <Text style={styles.batchSelectMeta}>
                  {b.code} · {b.weight_kg} kg
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 16 }} />
          <TouchableOpacity
            style={[styles.primary, creating && { opacity: 0.7 }]}
            onPress={handleCreateProduct}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryText}>Create & mint product QR</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCreateOpen(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Product QR modal */}
      <Modal
        visible={Boolean(productQrModal)}
        animationType="fade"
        transparent
        onRequestClose={() => setProductQrModal(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.qrCard}>
            {productQrModal ? (
              <>
                <Text style={styles.qrTitle}>{productQrModal.name}</Text>
                <Text style={styles.qrSubtitle}>{productQrModal.product_id}</Text>
                <QrTokenDisplay
                  token={productQrModal.qr_token}
                  png={productQrModal.qr_png}
                  label="Print this on the packaging"
                  size={240}
                />
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => setProductQrModal(null)}
                >
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </RoleHomeShell>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  secondary: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderColor: '#F97316',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryText: { color: '#C2410C', fontWeight: '700' },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#111827', marginBottom: 8 },
  center: { alignItems: 'center', padding: 32 },
  empty: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  cardMeta: { color: '#374151', fontSize: 13, marginTop: 4 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#C2410C', marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    color: '#111827',
  },
  batchSelect: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  batchSelectActive: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  batchSelectTitle: { fontWeight: '700', color: '#111827' },
  batchSelectMeta: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 380 },
  qrTitle: { fontSize: 20, fontWeight: '700', color: '#C2410C', textAlign: 'center' },
  qrSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
});
