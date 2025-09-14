import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import TransactionCard from './TransactionCard';
import { PENDING_TRANSACTIONS, COMPLETED_TRANSACTIONS, TAB_TYPES } from '../constants';

const TransactionList = ({ activeTab, onTransactionPress }) => {
  const transactions = activeTab === TAB_TYPES.PENDING 
    ? PENDING_TRANSACTIONS 
    : COMPLETED_TRANSACTIONS;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            activeTab={activeTab}
            onPress={onTransactionPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 12,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
});

export default TransactionList;
