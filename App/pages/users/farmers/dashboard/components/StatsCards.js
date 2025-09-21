import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const StatsCards = () => {
  const { t } = useGlobalTranslation();
  
  const stats = [
    { icon: '🌿', value: '8', label: t.farmerDashboard.activeBatches, color: '#22c55e' },
    { icon: '💰', value: '3', label: t.farmerDashboard.pendingPayments, color: '#F97316' },
    { icon: '🔔', value: '5', label: t.farmerDashboard.notifications, color: '#3B82F6' },
    { icon: '📚', value: '2', label: t.farmerDashboard.trainingTips, color: '#A855F7' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{stat.icon}</Text>
              <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
            </View>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default StatsCards;
