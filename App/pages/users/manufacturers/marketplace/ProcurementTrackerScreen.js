/**
 * Procurement Tracker — list all procurement requests with status + actions.
 *
 * Backend: GET  /api/v1/manufacturer/requests?status=
 *          POST /api/v1/manufacturer/requests/:id/cancel
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { ManufacturerAPI } from '../../../../services/apiClient';

const STATUS_STYLE = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  approved: { bg: '#D1FAE5', fg: '#065F46' },
  partially_approved: { bg: '#DBEAFE', fg: '#1E40AF' },
  rejected: { bg: '#FEE2E2', fg: '#991B1B' },
  cancelled: { bg: '#F3F4F6', fg: '#6B7280' },
  fulfilled: { bg: '#D1FAE5', fg: '#065F46' },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

export default function ProcurementTrackerScreen() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await ManufacturerAPI.listRequests(accessToken);
      setRequests(data.requests || []);
    } catch (err) {
      console.error('[ProcurementTracker]', err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (reqId) => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await ManufacturerAPI.cancelRequest(accessToken, reqId);
            load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          }
        },
      },
    ]);
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const renderItem = ({ item }) => {
    const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.code}>{item.request_code || item.id?.slice(0, 8)}</Text>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.fg }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.species}>{item.batch_code || item.batch_id?.slice(0, 8) || '—'}</Text>
        <View style={styles.qtyRow}>
          <Text style={styles.qty}>Requested: {item.requested_quantity_kg} kg</Text>
          {item.approved_quantity_kg && (
            <Text style={[styles.qty, { color: '#10B981' }]}>Approved: {item.approved_quantity_kg} kg</Text>
          )}
        </View>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Procurement Requests</Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
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
          ListEmptyComponent={<Text style={styles.empty}>No requests found.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#F97316' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 15, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  species: { fontSize: 13, color: '#374151', marginTop: 4 },
  qtyRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
  qty: { fontSize: 13, fontWeight: '600', color: '#374151' },
  notes: { fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  cancelBtn: { marginTop: 8, padding: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  cancelText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
