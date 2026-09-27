/**
 * Tiny weather card for the farmer home.
 *
 * The backend has no weather endpoint yet (weatherService.js exists but no
 * route mounts it), so this renders a clear "coming soon" state instead of
 * calling APIs that would 404. Kept tap-through so the weather screen (same
 * state) can carry the fuller message.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function WeatherCard({ onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.title}>Weather</Text>
      <Text style={styles.muted}>Coming soon — weather data isn't connected yet.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ECFEFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A5F3FC',
  },
  title: { color: '#075985', fontWeight: '700', marginBottom: 6 },
  muted: { color: '#64748B', fontSize: 12 },
});
