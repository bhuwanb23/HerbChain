import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Card = ({ icon, iconColor, value, label, delta, deltaColor }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <Icon name={icon} size={18} color={iconColor} />
      {delta !== undefined && (
        <Text style={[styles.delta, { color: deltaColor || '#10B981' }]}>{delta}</Text>
      )}
    </View>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const PerformanceOverview = ({ analytics }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Performance Overview</Text>
      <View style={styles.grid}>
        <Card icon="truck" iconColor="#2563EB" value={analytics.totalTrips} label="Total Trips" delta={'+12%'} deltaColor="#10B981" />
        <Card icon="map-marker-path" iconColor="#F59E0B" value={analytics.distanceCoveredKm.toLocaleString()} label="KM Covered" delta={'+8%'} deltaColor="#10B981" />
        <Card icon="clock-outline" iconColor="#6B7280" value={analytics.avgDeliveryTime} label="Avg Time" delta={'-3%'} deltaColor="#EF4444" />
        <Card icon="target-variant" iconColor="#10B981" value={analytics.successRate + '%'} label="On-Time" delta={'+5%'} deltaColor="#10B981" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  delta: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default PerformanceOverview;


