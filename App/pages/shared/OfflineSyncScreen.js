import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Shared offline sync center — placeholder until A6 builds the real UI.
 * Backend P17 sync endpoints are ready; this just needs the mobile client.
 */
export default function OfflineSyncScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>Offline Sync</Text>
      <Text style={styles.subtitle}>Pending sync, failed sync, conflict resolution.</Text>
      <Text style={styles.badge}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  badge: {
    marginTop: 16, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 999,
    fontSize: 12, fontWeight: '600',
  },
});
