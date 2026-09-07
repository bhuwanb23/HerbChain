/**
 * TransferRequests — farmer views and acts on incoming transfer requests.
 *
 * Backend: GET /api/v1/transfers/requests?status=pending,
 *          POST /api/v1/transfers/approve, POST /api/v1/transfers/reject
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { TransfersAPI } from '../../../services/apiClient';

const STATUS_COLORS = {
  pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', cancelled: '#9CA3AF', completed: '#0EA5E9',
};

export default function TransferRequests() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(null); // request id being acted on

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await TransfersAPI.listRequests(accessToken, { limit: 50 });
      setRequests(data.requests || []);
    } catch (err) {
      console.log('Failed to load transfer requests', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (requestId) => {
    setActing(requestId);
    try {
      await TransfersAPI.approve(accessToken, requestId);
      Alert.alert('Approved', 'Transfer request approved. The transporter can now pick up the batch.');
      await load();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to approve');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (requestId) => {
    Alert.prompt?.('Reject', 'Reason for rejection:', async (reason) => {
      setActing(requestId);
      try {
        await TransfersAPI.reject(accessToken, requestId, reason || 'Rejected by farmer');
        Alert.alert('Rejected', 'Transfer request rejected.');
        await load();
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to reject');
      } finally {
        setActing(null);
      }
    }) || (async () => {
      setActing(requestId);
      try {
        await TransfersAPI.reject(accessToken, requestId, 'Rejected by farmer');
        Alert.alert('Rejected', 'Transfer request rejected.');
        await load();
      } catch (err) {
        Alert.alert('Error', err.message || 'Failed to reject');
      } finally {
        setActing(null);
      }
    })();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transfer Requests</Text>
        <Text style={styles.count}>{requests.filter(r => r.status === 'pending').length} pending</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No transfer requests</Text>
            <Text style={styles.emptyText}>Requests from transporters will appear here.</Text>
          </View>
        ) : (
          requests.map((r) => {
            const color = STATUS_COLORS[r.status] || '#6B7280';
            const isPending = r.status === 'pending';
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{r.batch_code || r.batch_id || 'Batch'}</Text>
                    <Text style={styles.cardMeta}>
                      From: {r.requester_name || r.requester_user_id || '—'} · {r.type || 'pickup'}
                    </Text>
                  </View>
                  <Text style={[styles.statusBadge, { backgroundColor: `${color}20`, color }]}>{r.status}</Text>
                </View>

                {r.reason && <Text style={styles.reason}>Reason: {r.reason}</Text>}

                {isPending && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => handleApprove(r.id)}
                      disabled={acting === r.id}
                    >
                      {acting === r.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.approveText}>Approve</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      onPress={() => handleReject(r.id)}
                      disabled={acting === r.id}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  list: { padding: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  reason: { fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  approveText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  rejectText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
});
