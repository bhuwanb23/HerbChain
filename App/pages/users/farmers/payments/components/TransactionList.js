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
    paddingHorizontal: 16,
    marginTop: 16,
    paddingBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default TransactionList;
