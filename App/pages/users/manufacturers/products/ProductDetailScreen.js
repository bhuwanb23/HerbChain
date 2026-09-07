/**
 * Product Detail — formulas, manufacturing runs, lineage tree, QR view.
 *
 * Backend: GET /api/v1/products/:id (detail + formula + runs)
 *          GET /api/v1/products/:id/lineage
 *          GET /api/v1/manufacturing/lots/:lotId/qr
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturingAPI, ProductsAPI } from '../../../../services/apiClient';
import { QrTokenDisplay } from '../../../../components';

export default function ProductDetailScreen({ route }) {
  const { accessToken } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [lineage, setLineage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [prodData, linData] = await Promise.all([
        ProductsAPI.get(accessToken, productId),
        ProductsAPI.lineage(accessToken, productId).catch(() => null),
      ]);
      setProduct(prodData.product);
      setLineage(linData);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, productId]);

  useEffect(() => { load(); }, [load]);

  const showLotQr = async (lotId) => {
    try {
      const data = await ManufacturingAPI.lotQr(accessToken, lotId);
      setQrModal({ lotId, qr_token: data.qr_token || data.url, qr_png: data.qr_png });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#F97316" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  const p = product || {};
  const formulas = p.formulas || p.formula_lines || [];
  const runs = p.runs || [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{p.name}</Text>
      <Text style={styles.meta}>{p.code || '—'} · {p.category || 'other'}</Text>
      {p.sku && <Text style={styles.sku}>SKU: {p.sku}</Text>}
      {p.description && <Text style={styles.desc}>{p.description}</Text>}

      {/* Formulas */}
      <Text style={styles.sectionTitle}>Formula ({formulas.length})</Text>
      {formulas.length === 0 ? (
        <Text style={styles.empty}>No formula lines defined.</Text>
      ) : (
        formulas.map((f, i) => (
          <View key={f.id || i} style={styles.row}>
            <Text style={styles.rowText}>{f.species_code}</Text>
            <Text style={styles.rowValue}>{f.standard_quantity || '—'} {f.unit || 'kg'}</Text>
          </View>
        ))
      )}

      {/* Manufacturing runs */}
      <Text style={styles.sectionTitle}>Manufacturing Runs ({runs.length})</Text>
      {runs.length === 0 ? (
        <Text style={styles.empty}>No runs yet.</Text>
      ) : (
        runs.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.code}>{r.run_code || r.id?.slice(0, 8)}</Text>
              <Text style={[styles.status, { color: r.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                {r.status}
              </Text>
            </View>
            <Text style={styles.rowText}>Planned: {r.planned_units} units</Text>
            {r.produced_units && <Text style={styles.rowText}>Produced: {r.produced_units} units</Text>}
            {r.lot_id && (
              <TouchableOpacity style={styles.qrBtn} onPress={() => showLotQr(r.lot_id)}>
                <Text style={styles.qrBtnText}>Show QR</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {/* Lineage */}
      {lineage && (
        <>
          <Text style={styles.sectionTitle}>Lineage</Text>
          {lineage.ingredients?.map((ing, i) => (
            <View key={i} style={styles.lineageCard}>
              <Text style={styles.lineageTitle}>{ing.batch_code || ing.batch_id?.slice(0, 8)}</Text>
              <Text style={styles.lineageMeta}>{ing.species?.common_name || '—'} · {ing.quantity_kg || '—'} kg</Text>
              <Text style={styles.lineageMeta}>Farmer: {ing.farmer_name || '—'}</Text>
              {ing.lab_certified && <Text style={styles.certBadge}>Lab Certified ✓</Text>}
            </View>
          ))}
        </>
      )}

      {/* QR modal */}
      {qrModal && (
        <View style={styles.qrOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Product QR</Text>
            <Text style={styles.qrSub}>Lot: {qrModal.lotId}</Text>
            <QrTokenDisplay token={qrModal.qr_token} png={qrModal.qr_png} size={200} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModal(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sku: { fontSize: 12, color: '#374151', marginTop: 2 },
  desc: { fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
  empty: { fontSize: 13, color: '#9CA3AF' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowText: { fontSize: 13, color: '#374151' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 14, fontWeight: '700', color: '#111827' },
  status: { fontSize: 12, fontWeight: '700' },
  qrBtn: { marginTop: 8, padding: 8, backgroundColor: '#FEF3C7', borderRadius: 8, alignItems: 'center' },
  qrBtnText: { fontWeight: '700', fontSize: 12, color: '#92400E' },
  lineageCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#10B981' },
  lineageTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  lineageMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  certBadge: { fontSize: 11, color: '#059669', fontWeight: '700', marginTop: 4 },
  qrOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 340, alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: '700', color: '#C2410C' },
  qrSub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  closeBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#F97316', borderRadius: 10 },
  closeBtnText: { color: '#FFF', fontWeight: '700' },
});
