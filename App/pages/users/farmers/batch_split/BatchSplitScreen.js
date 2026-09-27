/**
 * Batch split screen — split a held with_farmer batch into multiple children.
 *
 * The backend has no POST /api/v1/batches/:id/split route yet, so this screen
 * renders a clear "coming soon" state instead of calling a missing API.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BatchSplitScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split a batch</Text>
        <Text style={styles.subtitle}>Only batches you hold in farmer phase</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.banner}>Coming soon — batch splitting isn't connected yet.</Text>
        <Text style={styles.muted}>
          Use Smart Register to create batches and transfers to move them. Splitting
          arrives with the next backend release.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#065F46' },
  subtitle: { color: '#6B7280', fontSize: 12 },
  banner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 12,
  },
  muted: { color: '#6B7280', lineHeight: 20 },
});
