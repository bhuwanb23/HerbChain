import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import TransactionItem from './TransactionItem';

const PaymentsBillingTab = ({ transactionHistory }) => {
  const handleViewAllTransactions = () => {
    Alert.alert('View All Transactions', 'Functionality to view all transactions will be implemented here.');
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>Transaction History</Text>
      <FlatList
        data={transactionHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.transactionListContent}
      />
      <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllTransactions}>
        <Text style={styles.viewAllButtonText}>View All Transactions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  transactionListContent: {
    rowGap: 12, // space-y-3
  },
  viewAllButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669', // primary
  },
  viewAllButtonText: {
    color: '#059669', // primary
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PaymentsBillingTab;