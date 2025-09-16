import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const QuickStats = ({ pendingAmount, availableAmount }) => {
  const stats = [
    {
      id: 'pending',
      icon: '⏰',
      title: 'Pending',
      amount: pendingAmount || '3,240',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      id: 'available',
      icon: '💰',
      title: 'Available',
      amount: availableAmount || '21,340',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat) => (
        <View key={stat.id} style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.iconContainer, { backgroundColor: stat.iconBg }]}>
              <Text style={[styles.icon, { color: stat.iconColor }]}>{stat.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{stat.title}</Text>
              <Text style={styles.amount}>₹{stat.amount}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default QuickStats;
