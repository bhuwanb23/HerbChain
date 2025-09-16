import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SustainabilityRewards = ({ co2Saved, greenBonus }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🌱</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Sustainability Impact</Text>
          <Text style={styles.subtitle}>This month's eco-friendly routes</Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{co2Saved || '24.5'}kg</Text>
          <Text style={styles.statLabel}>CO₂ Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>+₹{greenBonus || '245'}</Text>
          <Text style={styles.statLabel}>Green Bonus</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
    color: '#16A34A',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#14532D',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#15803D',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#15803D',
  },
});

export default SustainabilityRewards;
