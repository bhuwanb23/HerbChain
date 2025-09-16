import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const EarningsOverview = ({ totalEarnings, growthPercentage }) => {
  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.subtitle}>Total Earnings</Text>
          <Text style={styles.amount}>₹{totalEarnings?.toLocaleString() || '24,580'}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Text style={styles.chartIcon}>📈</Text>
        </View>
      </View>
      <View style={styles.growthSection}>
        <Text style={styles.growthIcon}>↗️</Text>
        <Text style={styles.growthText}>
          +{growthPercentage || '12.5'}% from last month
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  growthSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthIcon: {
    fontSize: 12,
    color: '#34D399',
    marginRight: 8,
  },
  growthText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default EarningsOverview;
