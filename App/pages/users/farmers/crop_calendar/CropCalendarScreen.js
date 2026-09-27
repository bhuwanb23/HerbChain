/**
 * Crop calendar — list crop plans grouped by status, add a new plan.
 *
 * The backend has no /api/v1/crop-plans routes yet, so this screen renders a
 * clear "coming soon" state instead of calling missing APIs.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CropCalendarScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Crop Planning Calendar</Text>
        <Text style={styles.subtitle}>plant→harvest timeline</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.banner}>Coming soon — crop plans aren't connected yet.</Text>
        <Text style={styles.muted}>
          Crop planning will land with the next backend release. Register your
          harvest batches from Smart Register — that works today.
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
