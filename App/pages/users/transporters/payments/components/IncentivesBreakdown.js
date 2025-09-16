import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const IncentivesBreakdown = ({ incentives = [] }) => {
  const defaultIncentives = [
    {
      id: 'eco-compliance',
      icon: '🌱',
      title: 'Eco-Compliance Bonus',
      description: '15 deliveries',
      amount: 750,
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      id: 'timely-delivery',
      icon: '⏰',
      title: 'Timely Delivery',
      description: '28 on-time deliveries',
      amount: 1400,
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      id: 'verified-handovers',
      icon: '🤝',
      title: 'Verified Handovers',
      description: '32 verified',
      amount: 960,
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
    },
  ];

  const displayIncentives = incentives.length > 0 ? incentives : defaultIncentives;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incentives Earned</Text>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayIncentives.map((incentive) => (
          <View key={incentive.id} style={styles.incentiveCard}>
            <View style={styles.incentiveContent}>
              <View style={styles.leftSection}>
                <View style={[styles.iconContainer, { backgroundColor: incentive.iconBg }]}>
                  <Text style={[styles.icon, { color: incentive.iconColor }]}>
                    {incentive.icon}
                  </Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.incentiveTitle}>{incentive.title}</Text>
                  <Text style={styles.incentiveDescription}>{incentive.description}</Text>
                </View>
              </View>
              <Text style={styles.amount}>+₹{incentive.amount?.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  scrollContainer: {
    maxHeight: 240,
  },
  incentiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incentiveContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  incentiveDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default IncentivesBreakdown;
