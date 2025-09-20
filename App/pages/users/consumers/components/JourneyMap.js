import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const JourneyMap = ({ from, to, title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={styles.gradientBackground} />
        <View style={styles.startPoint} />
        <View style={styles.endPoint} />
        <View style={styles.routeBorder} />
        <View style={styles.routeIcon}>
          <Ionicons name="map" size={24} color={COLORS.sage} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.route}>{from} → {to}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warmBeige,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  mapContainer: {
    height: 128,
    position: 'relative',
    marginBottom: 16,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${COLORS.sageLight}30`,
    borderRadius: 12,
  },
  startPoint: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 12,
    height: 12,
    backgroundColor: COLORS.sage,
    borderRadius: 6,
  },
  endPoint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 12,
    height: 12,
    backgroundColor: COLORS.sageDark,
    borderRadius: 6,
  },
  routeBorder: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 2,
    borderColor: `${COLORS.sage}40`,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  routeIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.earthBrown,
    marginBottom: 4,
  },
  route: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
});

export default JourneyMap;
