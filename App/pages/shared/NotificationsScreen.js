import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NotificationsAPI } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Shared notifications screen — works for all logged-in roles.
 * Fetches real data from the backend notifications endpoint.
 */
export default function NotificationsScreen() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    NotificationsAPI.inbox(accessToken, { limit: 50 })
      .then((data) => setItems(Array.isArray(data) ? data : data?.notifications || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const markAllRead = async () => {
    if (!accessToken) return;
    try {
      await NotificationsAPI.markRead(accessToken, [], true);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (_) {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Loading notifications...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.title}>No Notifications</Text>
        <Text style={styles.subtitle}>You're all caught up!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.unread]}>
            <Text style={styles.cardTitle}>{item.title || item.category || 'Notification'}</Text>
            <Text style={styles.cardBody} numberOfLines={2}>{item.message || item.body || ''}</Text>
            <Text style={styles.cardTime}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  placeholder: { fontSize: 14, color: '#9CA3AF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  markAll: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  card: {
    backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 14,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  unread: { borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardBody: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
});
