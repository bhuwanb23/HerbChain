import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Generic "coming soon" placeholder for screens gated behind feature flags.
 */
export default function ComingSoonScreen({ featureName }) {
  return (
    <View style={styles.center}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>{featureName || 'Coming Soon'}</Text>
      <Text style={styles.subtitle}>This feature is under development.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
});
