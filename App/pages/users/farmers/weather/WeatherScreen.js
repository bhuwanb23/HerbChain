/**
 * Weather screen — current + 3-day forecast for the farmer's farm location.
 *
 * No weather route is exposed by the backend yet, so this screen shows a
 * clear "coming soon" state instead of calling missing APIs.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function WeatherScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Local Weather</Text>
      <Text style={styles.subtitle}>Current conditions + 3-day forecast for your farm</Text>

      <Text style={styles.banner}>Coming soon — weather data isn't connected yet.</Text>
      <Text style={styles.muted}>
        The farm weather service is not available in this build. Register your
        batches as usual — everything else works.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#0E7490', marginTop: 6 },
  subtitle: { color: '#6B7280', marginBottom: 16, fontSize: 12 },
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
