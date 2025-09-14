import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const RecentTransactions = ({ transactions = [], onViewAll }) => {
  const defaultTransactions = [
    {
      id: 'weekly-payout',
      icon: '📥',
      title: 'Weekly Payout',
      date: 'Jan 15, 2024',
      amount: 5240,
      type: 'credit',
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
    {
      id: 'bonus-payment',
      icon: '🎁',
      title: 'Bonus Payment',
      date: 'Jan 12, 2024',
      amount: 750,
      type: 'credit',
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      id: 'eco-bonus',
      icon: '🌱',
      title: 'Eco Bonus',
      date: 'Jan 10, 2024',
      amount: 245,
      type: 'credit',
      iconBg: '#DCFCE7',
      iconColor: '#16A34A',
    },
  ];

  const displayTransactions = transactions.length > 0 ? transactions : defaultTransactions;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => onViewAll && onViewAll()} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionContent}>
              <View style={styles.leftSection}>
                <View style={[styles.iconContainer, { backgroundColor: transaction.iconBg }]}>
                  <Text style={[styles.icon, { color: transaction.iconColor }]}>
                    {transaction.icon}
                  </Text>
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <Text style={[
                styles.amount,
                { color: transaction.type === 'credit' ? '#16A34A' : '#DC2626' }
              ]}>
                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  scrollContainer: {
    maxHeight: 250,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionContent: {
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
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecentTransactions;
