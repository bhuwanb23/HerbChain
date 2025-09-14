import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const PaymentsScreen = ({ navigation }) => {
  const payments = [
    {
      id: 1,
      date: '2024-01-15',
      amount: '₹2,850',
      status: 'Completed',
      buyer: 'Green Herbs Co.',
      herb: 'Tulsi (Holy Basil)',
      quantity: '12.5 kg',
    },
    {
      id: 2,
      date: '2024-01-12',
      amount: '₹1,200',
      status: 'Pending',
      buyer: 'Ayurveda Solutions',
      herb: 'Ashwagandha',
      quantity: '8 kg',
    },
    {
      id: 3,
      date: '2024-01-10',
      amount: '₹3,500',
      status: 'Completed',
      buyer: 'Herbal Wellness',
      herb: 'Neem Leaves',
      quantity: '15 kg',
    },
    {
      id: 4,
      date: '2024-01-08',
      amount: '₹950',
      status: 'Processing',
      buyer: 'Nature Cure',
      herb: 'Mint',
      quantity: '5 kg',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return '#22c55e';
      case 'Pending':
        return '#f59e0b';
      case 'Processing':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const handlePaymentPress = (payment) => {
    Alert.alert(
      'Payment Details',
      `Buyer: ${payment.buyer}\nHerb: ${payment.herb}\nQuantity: ${payment.quantity}\nAmount: ${payment.amount}\nStatus: ${payment.status}`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Earnings</Text>
          <Text style={styles.summaryAmount}>₹8,500</Text>
          <Text style={styles.summaryPeriod}>This Month</Text>
        </View>

        <View style={styles.paymentsList}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {payments.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={styles.paymentCard}
              onPress={() => handlePaymentPress(payment)}
            >
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentAmount}>{payment.amount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                  <Text style={styles.statusText}>{payment.status}</Text>
                </View>
              </View>
              <Text style={styles.buyerName}>{payment.buyer}</Text>
              <Text style={styles.herbInfo}>{payment.herb} - {payment.quantity}</Text>
              <Text style={styles.paymentDate}>{payment.date}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  paymentsList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  herbInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default PaymentsScreen;
