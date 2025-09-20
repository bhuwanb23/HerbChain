import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TransactionItem = ({ transaction }) => {
  const getTransactionStyle = (type) => {
    switch (type) {
      case 'credit':
        return { borderColor: '#16a34a', bgColor: '#dcfce7', textColor: '#16a34a' }; // green
      case 'debit':
        return { borderColor: '#dc2626', bgColor: '#fee2e2', textColor: '#dc2626' }; // red
      default:
        return { borderColor: '#d1d5db', bgColor: '#f3f4f6', textColor: '#4b5563' }; // gray
    }
  };

  const { borderColor, bgColor, textColor } = getTransactionStyle(transaction.type);

  return (
    <View style={[styles.transactionCard, { borderLeftColor: borderColor, backgroundColor: bgColor }]}>
      <View style={[styles.iconWrapper, { backgroundColor: borderColor }]}>
        <Icon name={transaction.icon} size={20} color="#fff" />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.orderInfo}>Order #{transaction.orderId} - {transaction.timeAgo}</Text>
      </View>
      <Text style={[styles.amount, { color: textColor }]}>{transaction.amount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  orderInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransactionItem;