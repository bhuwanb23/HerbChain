import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { TAB_TYPES } from '../constants';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

export const usePayments = () => {
  const { t } = useGlobalTranslation();
  const [activeTab, setActiveTab] = useState(TAB_TYPES.PENDING);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleWithdraw = useCallback(() => {
    Alert.alert(
      t.farmerPayments?.withdrawFunds || 'Withdraw Funds',
      t.farmerPayments?.withdrawDescription || 'This feature will redirect you to your bank account for withdrawal.',
      [
        { text: t.consumer?.cancel || 'Cancel', style: 'cancel' },
        { text: t.farmerPayments?.continue || 'Continue', onPress: () => {
          // Handle withdrawal logic here
          Alert.alert(
            t.farmerPayments?.successTitle || 'Success', 
            t.farmerPayments?.withdrawalRequested || 'Withdrawal request submitted successfully!'
          );
        }},
      ]
    );
  }, [t]);

  const handleTransactionPress = useCallback((transaction) => {
    const dateLabel = activeTab === TAB_TYPES.PENDING 
      ? (t.farmerPayments?.expected || 'Expected')
      : (t.farmerPayments?.paidOn || 'Paid on');
    
    const dateValue = activeTab === TAB_TYPES.PENDING 
      ? transaction.expectedDate 
      : transaction.paidDate;

    Alert.alert(
      t.farmerPayments?.transactionDetails || 'Transaction Details',
      `${t.farmerPayments?.buyer || 'Buyer'}: ${transaction.buyer}\n${t.farmerPayments?.amount || 'Amount'}: ${transaction.amount}\n${t.farmerPayments?.batchNumber || 'Batch #'}: ${transaction.id}\n${dateLabel}: ${dateValue}`,
      [{ text: t.farmerPayments?.ok || 'OK' }]
    );
  }, [activeTab, t]);

  return {
    activeTab,
    handleTabChange,
    handleWithdraw,
    handleTransactionPress,
  };
};
