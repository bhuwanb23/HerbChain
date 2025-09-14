import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const PayoutOptions = ({ payoutMethods = [], onMethodSelect }) => {
  const defaultMethods = [
    {
      id: 'bank-transfer',
      icon: '🏦',
      title: 'Bank Transfer',
      description: 'SBI •••• 4567',
      isActive: true,
      action: null,
    },
    {
      id: 'upi',
      icon: '📱',
      title: 'UPI',
      description: 'driver@paytm',
      isActive: false,
      action: 'Setup',
    },
    {
      id: 'digital-wallet',
      icon: '💳',
      title: 'Digital Wallet',
      description: 'Link your wallet',
      isActive: false,
      action: 'Add',
    },
  ];

  const displayMethods = payoutMethods.length > 0 ? payoutMethods : defaultMethods;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payout Options</Text>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              method.isActive && styles.activeMethodCard
            ]}
            onPress={() => onMethodSelect && onMethodSelect(method)}
            activeOpacity={0.7}
          >
            <View style={styles.methodContent}>
              <View style={styles.leftSection}>
                <Text style={styles.methodIcon}>{method.icon}</Text>
                <View style={styles.textContainer}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              {method.isActive ? (
                <Text style={styles.checkIcon}>✅</Text>
              ) : (
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>{method.action}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 200,
  },
  methodCard: {
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
  activeMethodCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  methodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkIcon: {
    fontSize: 18,
    color: '#10B981',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
});

export default PayoutOptions;
