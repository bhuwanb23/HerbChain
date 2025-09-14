import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TAB_TYPES } from '../constants';

const TransactionCard = ({ transaction, activeTab, onPress }) => {
  const getIconName = (iconType) => {
    switch (iconType) {
      case 'user':
        return 'person';
      case 'building':
        return 'business';
      case 'store':
        return 'store';
      case 'check':
        return 'check-circle';
      default:
        return 'receipt';
    }
  };

  const getStatusText = () => {
    return activeTab === TAB_TYPES.PENDING ? 'Pending' : 'Completed';
  };

  const getStatusColor = () => {
    return activeTab === TAB_TYPES.PENDING ? '#F59E0B' : '#10B981';
  };

  const getStatusBackgroundColor = () => {
    return activeTab === TAB_TYPES.PENDING 
      ? 'rgba(245, 158, 11, 0.1)' 
      : 'rgba(16, 185, 129, 0.1)';
  };

  const getDateLabel = () => {
    return activeTab === TAB_TYPES.PENDING ? 'Expected' : 'Paid on';
  };

  const getDateValue = () => {
    return activeTab === TAB_TYPES.PENDING 
      ? transaction.expectedDate 
      : transaction.paidDate;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.buyerInfo}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: transaction.backgroundColor }
          ]}>
            <Icon 
              name={getIconName(transaction.icon)} 
              size={16} 
              color={transaction.iconColor} 
            />
          </View>
          <View style={styles.buyerDetails}>
            <Text style={styles.buyerName}>{transaction.buyer}</Text>
            <Text style={styles.batchId}>Batch #{transaction.id}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusBackgroundColor() }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor() }
          ]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{transaction.amount}</Text>
        </View>
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.dateValue}>{getDateValue()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  buyerDetails: {
    flex: 1,
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  batchId: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountSection: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 1,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dateSection: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 1,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
});

export default TransactionCard;
