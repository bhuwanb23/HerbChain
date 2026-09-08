import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SyncAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_TABS = ['All', 'Pending', 'Synced', 'Failed', 'Conflicts'];

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  SYNCING: '#3B82F6',
  SYNCED: '#10B981',
  FAILED: '#EF4444',
  CONFLICT: '#8B5CF6',
};

const CONFLICT_ICONS = {
  ownership_changed: '🔄',
  unknown_token: '❓',
  duplicate_draft: '📋',
  schema_mismatch: '⚠️',
};

export default function OfflineSyncScreen() {
  const { accessToken } = useAuth();
  const [syncStatus, setSyncStatus] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState('main'); // main | conflicts | analytics

  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [status, conflictData] = await Promise.all([
        SyncAPI.status(accessToken),
        SyncAPI.conflicts(accessToken),
      ]);
      setSyncStatus(status);
      setConflicts(conflictData?.conflicts || []);
    } catch (_) {
      setSyncStatus(null);
      setConflicts([]);
    }
  }, [accessToken]);

  useEffect(() => {
    setLoading(true);
    fetchStatus().finally(() => setLoading(false));
  }, [fetchStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      // In a real app, this would replay the local SQLite queue via SyncAPI.upload
      Alert.alert('Sync', 'Sync initiated. The app will upload any pending offline changes.');
      await fetchStatus();
    } catch (_) {
      Alert.alert('Error', 'Sync failed. Will retry automatically.');
    }
    setSyncing(false);
  };

  const resolveConflict = async (conflictId, resolution) => {
    try {
      await SyncAPI.resolveConflict(accessToken, conflictId, { resolution });
      Alert.alert('Resolved', `Conflict resolved: ${resolution}`);
      fetchStatus();
    } catch (_) {
      Alert.alert('Error', 'Failed to resolve conflict.');
    }
  };

  // ─── Conflict detail ───
  if (view === 'conflicts') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('main')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conflicts ({conflicts.length})</Text>
          <View style={{ width: 60 }} />
        </View>
        {conflicts.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.title}>No conflicts</Text>
            <Text style={styles.subtitle}>All synced items were applied successfully.</Text>
          </View>
        ) : (
          <FlatList
            data={conflicts}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.conflictCard}>
                <View style={styles.conflictHeader}>
                  <Text style={styles.conflictIcon}>{CONFLICT_ICONS[item.conflict_type] || '⚠️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conflictType}>{item.conflict_type?.replace(/_/g, ' ')}</Text>
                    <Text style={styles.conflictEntity}>{item.entity_type} · {item.local_id?.slice(0, 12)}</Text>
                  </View>
                </View>

                {/* Server vs Client comparison */}
                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>📱 Your data</Text>
                    <Text style={styles.compareText} numberOfLines={3}>
                      {JSON.stringify(item.client_payload || item.local_payload || {}, null, 0).slice(0, 150)}
                    </Text>
                  </View>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>☁️ Server data</Text>
                    <Text style={styles.compareText} numberOfLines={3}>
                      {JSON.stringify(item.server_state || {}, null, 0).slice(0, 150)}
                    </Text>
                  </View>
                </View>

                {/* Resolution buttons */}
                <View style={styles.resolveRow}>
                  <TouchableOpacity
                    style={[styles.resolveBtn, styles.resolveKeep]}
                    onPress={() => resolveConflict(item.id, 'applied')}
                  >
                    <Text style={styles.resolveBtnText}>Keep mine</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveBtn, styles.resolveDiscard]}
                    onPress={() => resolveConflict(item.id, 'discard')}
                  >
                    <Text style={styles.resolveBtnText}>Discard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveBtn, styles.resolveRequeue]}
                    onPress={() => resolveConflict(item.id, 'requeue')}
                  >
                    <Text style={styles.resolveBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // ─── Main screen ───
  const stats = syncStatus || {};
  const pending = stats.pending_count || 0;
  const syncedToday = stats.synced_today || 0;
  const failedCount = stats.failed_count || 0;
  const lastSync = stats.last_sync_at;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline Sync</Text>
        <TouchableOpacity onPress={() => setView('conflicts')} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>Conflicts ({conflicts.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <>
              {/* Status cards */}
              <View style={styles.statsGrid}>
                <StatCard icon="📤" label="Pending" value={pending} color="#F59E0B" />
                <StatCard icon="✅" label="Synced" value={syncedToday} color="#10B981" />
                <StatCard icon="❌" label="Failed" value={failedCount} color="#EF4444" />
                <StatCard icon="⚠️" label="Conflicts" value={conflicts.length} color="#8B5CF6" />
              </View>

              {/* Last sync info */}
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Last sync</Text>
                <Text style={styles.infoValue}>
                  {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                </Text>
              </View>

              {/* Sync now button */}
              <TouchableOpacity
                style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
                onPress={triggerSync}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.syncBtnText}>🔄 Sync Now</Text>
                )}
              </TouchableOpacity>

              {/* Queue section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sync Queue</Text>
              </View>

              {/* Pending items hint */}
              {pending > 0 && (
                <View style={styles.queueInfo}>
                  <Text style={styles.queueInfoText}>
                    {pending} item{pending !== 1 ? 's' : ''} waiting to sync. Tap "Sync Now" to upload.
                  </Text>
                </View>
              )}

              {pending === 0 && failedCount === 0 && conflicts.length === 0 && (
                <View style={styles.center}>
                  <Text style={styles.icon}>📡</Text>
                  <Text style={styles.title}>Everything synced</Text>
                  <Text style={styles.subtitle}>All your offline changes have been uploaded.</Text>
                </View>
              )}
            </>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: 200 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF3C7' },
  headerBtnText: { fontSize: 13, color: '#92400E', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  statCard: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  infoCard: {
    backgroundColor: '#FFF', marginHorizontal: 12, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between',
  },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  syncBtn: {
    backgroundColor: '#3B82F6', marginHorizontal: 12, marginTop: 12, paddingVertical: 14,
    borderRadius: 10, alignItems: 'center',
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionHeader: { padding: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  queueInfo: {
    backgroundColor: '#FFFBEB', marginHorizontal: 12, padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  queueInfoText: { fontSize: 13, color: '#92400E' },
  conflictCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  conflictIcon: { fontSize: 24, marginRight: 10 },
  conflictType: { fontSize: 15, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  conflictEntity: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  compareRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  compareCol: {
    flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  compareLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  compareText: { fontSize: 12, color: '#374151', fontFamily: 'monospace' },
  resolveRow: { flexDirection: 'row', gap: 8 },
  resolveBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  resolveKeep: { backgroundColor: '#D1FAE5' },
  resolveDiscard: { backgroundColor: '#FEE2E2' },
  resolveRequeue: { backgroundColor: '#E0E7FF' },
  resolveBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
});
