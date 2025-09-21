import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import TransactionCard from './TransactionCard';
import { PENDING_TRANSACTIONS, COMPLETED_TRANSACTIONS, TAB_TYPES } from '../constants';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const TransactionList = ({ activeTab, onTransactionPress }) => {
  const { t } = useGlobalTranslation();
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
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              activeTab={activeTab}
              onPress={onTransactionPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t.farmerPayments?.noTransactionsFound || 'No transactions found'}
            </Text>
          </View>
        )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TransactionList;
