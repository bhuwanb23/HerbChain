import React from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator } from 'react-native';
import TransactionCard from './TransactionCard';
import { PENDING_TRANSACTIONS, COMPLETED_TRANSACTIONS, TAB_TYPES } from '../constants';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const TransactionList = ({ activeTab, onTransactionPress, transactions, isTranslating }) => {
  const { t } = useGlobalTranslation();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isTranslating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#10B981" />
            <Text style={styles.loadingText}>
              {t.farmerPayments?.loadingTransactions || 'Translating transactions...'}
            </Text>
          </View>
        )}
        
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              activeTab={activeTab}
              onPress={onTransactionPress}
            />
          ))
        ) : !isTranslating ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t.farmerPayments?.noTransactionsFound || 'No transactions found'}
            </Text>
          </View>
        ) : null}
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});

export default TransactionList;
