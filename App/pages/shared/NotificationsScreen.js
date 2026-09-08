import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { NotificationsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const TABS = ['All', 'Unread', 'Critical'];

const PRIORITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#9CA3AF',
};

const CATEGORY_ICONS = {
  batch: '🌿',
  shipment: '🚚',
  ownership: '🔄',
  lab: '🧪',
  manufacturer: '🏭',
  recall: '⚠️',
  user: '👤',
  security: '🔒',
  system: '⚙️',
};

export default function NotificationsScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await NotificationsAPI.inbox(accessToken, { limit: 100 });
      setItems(Array.isArray(data) ? data : data?.notifications || []);
    } catch (_) {
      setItems([]);
    }
  }, [accessToken]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    if (!accessToken) return;
    try {
      await NotificationsAPI.markRead(accessToken, [], true);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch (_) {}
  };

  const markSingleRead = async (id) => {
    if (!accessToken) return;
    try {
      await NotificationsAPI.markRead(accessToken, [id]);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    } catch (_) {}
  };

  const loadPreferences = async () => {
    if (!accessToken) return;
    setPrefsLoading(true);
    try {
      const data = await NotificationsAPI.preferences(accessToken);
      setPreferences(data);
    } catch (_) {
      setPreferences({});
    }
    setPrefsLoading(false);
  };

  const toggleShowPrefs = () => {
    if (!showPrefs && !preferences) loadPreferences();
    setShowPrefs(!showPrefs);
  };

  // Filter by tab
  const filtered = items.filter((n) => {
    if (activeTab === 'Unread') return !n.is_read;
    if (activeTab === 'Critical') return n.priority === 'CRITICAL' || n.priority === 'HIGH';
    return true;
  });

  const unreadCount = items.filter((n) => !n.is_read).length;

  // Deep-link to entity
  const handlePress = (item) => {
    markSingleRead(item.id);
    if (item.entity_type && item.entity_id) {
      const entityMap = {
        batch: { screen: 'BatchDetail', paramKey: 'batchId' },
        shipment: { screen: 'ShipmentDetail', paramKey: 'shipmentId' },
        transfer_request: { screen: 'TransferRequests' },
      };
      const target = entityMap[item.entity_type];
      if (target && navigation) {
        const params = {};
        if (target.paramKey) params[target.paramKey] = item.entity_id;
        navigation.navigate(target.screen, params);
      }
    }
  };

  // ─── Preferences sub-screen ───
  if (showPrefs) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleShowPrefs}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={{ width: 60 }} />
        </View>
        {prefsLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
        ) : (
          <FlatList
            data={Object.entries(preferences || {})}
            keyExtractor={([key]) => key}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: [key, value] }) => (
              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>{key.replace(/_/g, ' ')}</Text>
                <Text style={[styles.prefValue, { color: value ? '#10B981' : '#EF4444' }]}>
                  {value ? 'ON' : 'OFF'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // ─── Main screen ───
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.placeholder}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleShowPrefs} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>⚙️</Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const count = tab === 'All' ? items.length : tab === 'Unread' ? unreadCount : items.filter((n) => n.priority === 'CRITICAL' || n.priority === 'HIGH').length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>No notifications</Text>
          <Text style={styles.subtitle}>
            {activeTab === 'Unread' ? "You're all caught up!" : 'Nothing here yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.unread]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>
                  {CATEGORY_ICONS[item.category] || '📌'}
                </Text>
                <View style={styles.cardContent}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title || item.type || 'Notification'}
                    </Text>
                    {item.priority && (
                      <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] || '#9CA3AF' }]} />
                    )}
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {item.body || item.message || ''}
                  </Text>
                  <Text style={styles.cardTime}>
                    {item.created_at ? formatTime(item.created_at) : ''}
                    {item.entity_type ? ` · ${item.entity_type}` : ''}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  placeholder: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnText: { fontSize: 18 },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  markAll: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#3B82F6' },
  card: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  unread: { borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  cardContent: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  cardBody: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  prefLabel: { fontSize: 15, color: '#111827', textTransform: 'capitalize' },
  prefValue: { fontSize: 14, fontWeight: '700' },
});
