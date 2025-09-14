import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PerformanceSummary = ({ stats }) => {
  const summaryCards = [
    {
      id: 'total',
      title: 'Total Trips',
      value: stats.totalTrips,
      icon: 'local-shipping',
      gradient: ['#059669', '#10b981'],
    },
    {
      id: 'completed',
      title: 'Completed',
      value: stats.completed,
      icon: 'check-circle',
      gradient: ['#3b82f6', '#2563eb'],
    },
    {
      id: 'avgDuration',
      title: 'Avg Duration',
      value: stats.avgDuration,
      icon: 'schedule',
      gradient: ['#f59e0b', '#f97316'],
    },
    {
      id: 'rejected',
      title: 'Rejected',
      value: stats.rejected,
      icon: 'warning',
      gradient: ['#ef4444', '#dc2626'],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {summaryCards.map((card, index) => (
          <LinearGradient
            key={card.id}
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.card,
              index < 2 && styles.topRow,
              index >= 2 && styles.bottomRow,
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardValue}>{card.value}</Text>
              </View>
              <Icon name={card.icon} size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  grid: {
    gap: 12,
  },
  topRow: {
    marginBottom: 0,
  },
  bottomRow: {
    marginTop: 0,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PerformanceSummary;
