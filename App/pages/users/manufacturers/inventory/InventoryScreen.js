/**
 * Manufacturer Inventory — list with available/reserved/consumed tabs + actions.
 *
 * Backend: GET /api/v1/manufacturer/inventory?status=
 *          POST /api/v1/manufacturer/inventory/:id/reserve
 *          POST /api/v1/manufacturer/inventory/:id/consume
 *          POST /api/v1/manufacturer/inventory/:id/discard
 *          POST /api/v1/manufacturer/inventory/:id/adjust
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI } from '../../../../services/apiClient';

const TABS = ['all', 'available', 'reserved', 'consumed'];
const STATUS_COLORS = { available: '#10B981', reserved: '#F59E0B', consumed: '#6B7280', discarded: '#EF4444' };

export default function InventoryScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionQty, setActionQty] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ManufacturerAPI.inventory(accessToken);
      setItems(data.inventory || []);
    } catch (err) {
      console.error('[Inventory]', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === 'all' ? items : items.filter((i) => i.status === tab);

  const openAction = (item, type) => {
    setActionItem(item);
    setActionType(type);
    setActionQty('');
    setActionReason('');
  };

  const handleAction = async () => {
    const qty = parseFloat(actionQty);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid', 'Enter a positive quantity.');
      return;
    }
    setSubmitting(true);
    try {
      if (actionType === 'reserve') {
        await ManufacturerAPI.reserveItem(accessToken, actionItem.id, { quantity_kg: qty });
      } else if (actionType === 'consume') {
        await ManufacturerAPI.consumeItem(accessToken, actionItem.id, { quantity_kg: qty, reason: actionReason.trim() || undefined });
      } else if (actionType === 'discard') {
        await ManufacturerAPI.discardItem(accessToken, actionItem.id, { quantity_kg: qty, reason: actionReason.trim() || undefined });
      } else if (actionType === 'adjust') {
        await ManufacturerAPI.adjustItem(accessToken, actionItem.id, { quantity_kg: qty, reason: actionReason.trim() || undefined });
      }
      setActionItem(null);
      load();
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const sc = STATUS_COLORS[item.status] || '#6B7280';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.code}>{item.batch_code || item.id?.slice(0, 8)}</Text>
          <View style={[styles.badge, { backgroundColor: sc + '20' }]}>
            <Text style={[styles.badgeText, { color: sc }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.species}>{item.species?.common_name || '—'}</Text>
        <View style={styles.qtyRow}>
          <Text style={styles.qty}>Total: {item.quantity_kg} kg</Text>
          <Text style={styles.qty}>Available: {item.available_kg ?? item.quantity_kg} kg</Text>
        </View>

        {item.status === 'available' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openAction(item, 'reserve')}>
              <Text style={styles.actionText}>Reserve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => openAction(item, 'discard')}>
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Discard</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.status === 'reserved' && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => openAction(item, 'consume')}>
              <Text style={[styles.actionText, { color: '#059669' }]}>Consume</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t} ({t === 'all' ? items.length : items.filter((i) => i.status === t).length})
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
          ListEmptyComponent={<Text style={styles.empty}>No inventory items.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Action modal */}
      <Modal visible={Boolean(actionItem)} animationType="slide" onRequestClose={() => setActionItem(null)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{actionType.toUpperCase()}</Text>
          <Text style={styles.modalSub}>
            {actionItem?.batch_code || actionItem?.id?.slice(0, 8)} · {actionItem?.available_kg ?? actionItem?.quantity_kg} kg available
          </Text>

          <Text style={styles.label}>Quantity (kg)</Text>
          <TextInput
            style={styles.input}
            value={actionQty}
            onChangeText={setActionQty}
            keyboardType="decimal-pad"
            placeholder="Enter quantity"
            placeholderTextColor="#9CA3AF"
          />

          {(actionType === 'consume' || actionType === 'discard' || actionType === 'adjust') && (
            <>
              <Text style={styles.label}>Reason / Reference</Text>
              <TextInput
                style={styles.input}
                value={actionReason}
                onChangeText={setActionReason}
                placeholder="e.g. MFG-RUN-001"
                placeholderTextColor="#9CA3AF"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.primary, submitting && { opacity: 0.7 }]}
            onPress={handleAction}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Confirm</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActionItem(null)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#F97316' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  species: { fontSize: 13, color: '#374151', marginTop: 4 },
  qtyRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  qty: { fontSize: 13, fontWeight: '600', color: '#374151' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center' },
  actionText: { fontWeight: '700', fontSize: 12, color: '#92400E' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  modal: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#C2410C', marginTop: 12 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginTop: 6, color: '#111827', fontSize: 14 },
  primary: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  cancel: { textAlign: 'center', color: '#6B7280', marginTop: 14, fontSize: 14 },
});
