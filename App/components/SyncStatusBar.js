/**
 * SyncStatusBar — global connectivity banner visible on every screen.
 *
 * States:
 *   🟢 Online — All changes synced (green, subtle)
 *   🟡 Syncing... (N pending) — (yellow, animated)
 *   🔴 Offline — Changes saved locally (red, prominent)
 *   🟠 Sync Error — Tap to retry (orange, tappable)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';

export default function SyncStatusBar({ pendingCount = 0, syncState = 'idle', onRetry }) {
  const { isOnline } = useNetwork();
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for syncing state
  useEffect(() => {
    if (syncState === 'syncing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [syncState, pulseAnim]);

  // Don't show if online and no pending items
  if (isOnline && syncState === 'idle' && pendingCount === 0) return null;

  let bgColor, icon, text, textColor;

  if (!isOnline) {
    bgColor = '#FEE2E2';
    icon = '🔴';
    text = 'Offline — Changes saved locally';
    textColor = '#991B1B';
  } else if (syncState === 'error') {
    bgColor = '#FEF3C7';
    icon = '🟠';
    text = 'Sync error — Tap to retry';
    textColor = '#92400E';
  } else if (syncState === 'syncing') {
    bgColor = '#FEF3C7';
    icon = '🟡';
    text = `Syncing... ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}`;
    textColor = '#92400E';
  } else if (pendingCount > 0) {
    bgColor = '#FEF3C7';
    icon = '🟡';
    text = `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`;
    textColor = '#92400E';
  } else {
    // Online, all synced — subtle green
    bgColor = '#D1FAE5';
    icon = '🟢';
    text = 'Online — All synced';
    textColor = '#065F46';
  }

  const content = (
    <View style={[styles.banner, { backgroundColor: bgColor }]}>
      <Animated.View style={{ opacity: syncState === 'syncing' ? pulseAnim : 1 }}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>{text}</Text>
    </View>
  );

  if (syncState === 'error' && onRetry) {
    return (
      <TouchableOpacity onPress={onRetry} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  icon: { fontSize: 12 },
  text: { fontSize: 12, fontWeight: '600', flex: 1 },
});
