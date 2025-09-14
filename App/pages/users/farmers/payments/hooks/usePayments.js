import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { TAB_TYPES } from '../constants';

export const usePayments = () => {
  const [activeTab, setActiveTab] = useState(TAB_TYPES.PENDING);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleWithdraw = useCallback(() => {
    Alert.alert(
      'Withdraw Funds',
      'This feature will redirect you to your bank account for withdrawal.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // Handle withdrawal logic here
          Alert.alert('Success', 'Withdrawal request submitted successfully!');
        }},
      ]
    );
  }, []);

  const handleTransactionPress = useCallback((transaction) => {
    Alert.alert(
      'Transaction Details',
      `Buyer: ${transaction.buyer}\nAmount: ${transaction.amount}\nBatch ID: ${transaction.id}\n${
        activeTab === TAB_TYPES.PENDING 
          ? `Expected: ${transaction.expectedDate}` 
          : `Paid on: ${transaction.paidDate}`
      }`,
      [{ text: 'OK' }]
    );
  }, [activeTab]);

  return {
    activeTab,
    handleTabChange,
    handleWithdraw,
    handleTransactionPress,
  };
};
