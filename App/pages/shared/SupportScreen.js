import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Shared help & support screen — placeholder until A6 builds the real UI.
 */
export default function SupportScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Raise a ticket, browse FAQs, or contact support.</Text>
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
