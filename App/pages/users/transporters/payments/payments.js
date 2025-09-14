import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PaymentsHeader,
  EarningsOverview,
  MonthlyTarget,
  QuickStats,
  IncentivesBreakdown,
  SustainabilityRewards,
  PayoutOptions,
  RecentTransactions,
  WithdrawButton,
} from './components';
import { MOCK_PAYMENT_DATA, MOCK_INCENTIVES, MOCK_PAYOUT_METHODS, MOCK_TRANSACTIONS } from './constants';

const PaymentsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [paymentData] = useState(MOCK_PAYMENT_DATA);
  const [incentives] = useState(MOCK_INCENTIVES);
  const [payoutMethods] = useState(MOCK_PAYOUT_METHODS);
  const [transactions] = useState(MOCK_TRANSACTIONS);

  const handleNotificationPress = () => {
    // Navigate to notifications or show notification modal
    console.log('Notification pressed');
  };

  const handlePayoutMethodSelect = (method) => {
    if (method.isActive) {
      Alert.alert('Method Selected', `${method.title} is already active`);
    } else {
      Alert.alert(
        'Setup Required',
        `Would you like to setup ${method.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Setup', onPress: () => console.log(`Setting up ${method.title}`) },
        ]
      );
    }
  };

  const handleViewAllTransactions = () => {
    // Navigate to full transactions list
    console.log('View all transactions');
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Funds',
      `Are you sure you want to withdraw ₹${paymentData.availableAmount.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          onPress: () => {
            Alert.alert('Success', 'Withdrawal request submitted successfully!');
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PaymentsHeader onNotificationPress={handleNotificationPress} />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <EarningsOverview 
          totalEarnings={paymentData.totalEarnings}
          growthPercentage={paymentData.growthPercentage}
        />
        
        <MonthlyTarget 
          earned={paymentData.earnedAmount}
          target={paymentData.monthlyTarget}
          percentage={paymentData.targetPercentage}
        />
        
        <QuickStats 
          pendingAmount={paymentData.pendingAmount}
          availableAmount={paymentData.availableAmount}
        />
        
        <IncentivesBreakdown incentives={incentives} />
        
        <SustainabilityRewards 
          co2Saved={paymentData.co2Saved}
          greenBonus={paymentData.greenBonus}
        />
        
        <PayoutOptions 
          payoutMethods={payoutMethods}
          onMethodSelect={handlePayoutMethodSelect}
        />
        
        <RecentTransactions 
          transactions={transactions}
          onViewAll={handleViewAllTransactions}
        />
        
        <WithdrawButton 
          availableAmount={paymentData.availableAmount}
          onWithdraw={handleWithdraw}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default PaymentsScreen;
