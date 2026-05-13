/**
 * Renders a base64 PNG QR code returned by the backend, plus the underlying
 * token (truncated) for debugging / copy-paste during development.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function QrTokenDisplay({ token, png, label, size = 220 }) {
  if (!png && !token) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No active QR for this batch.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {png ? (
        <Image
          source={{ uri: png }}
          style={{ width: size, height: size, borderRadius: 12 }}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Text style={styles.placeholderText}>(no image)</Text>
        </View>
      )}
      {token ? (
        <Text style={styles.tokenLabel} selectable>
          Token: {token.slice(0, 36)}…
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: { fontSize: 14, fontWeight: '600', color: '#065F46', marginBottom: 12 },
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  placeholderText: { color: '#9CA3AF' },
  tokenLabel: { fontSize: 11, color: '#6B7280', marginTop: 8, paddingHorizontal: 4 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#6B7280' },
});
