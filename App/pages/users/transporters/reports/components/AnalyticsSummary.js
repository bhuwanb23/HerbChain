import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatCard = ({ label, value, suffix, color }) => (
  <View style={[styles.statCard, { borderColor: color + '33' }]}> 
    <Text style={[styles.value, { color }]}>{value}{suffix ? suffix : ''}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const AnalyticsSummary = ({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Analytics</Text>
      <View style={styles.grid}>
        <StatCard label="Trips Completed" value={data.totalTrips} color="#059669" />
        <StatCard label="Success Rate" value={data.successRate} suffix="%" color="#10B981" />
        <StatCard label="Avg Delivery Time" value={data.avgDeliveryTime} color="#3B82F6" />
        <StatCard label="Distance Covered" value={data.distanceCoveredKm + ' km'} color="#F59E0B" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default AnalyticsSummary;


