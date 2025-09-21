import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { TAB_TYPES, PENDING_TRANSACTIONS, COMPLETED_TRANSACTIONS } from '../constants';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';
import { useDynamicTranslation } from '../../../../../hooks/useDynamicTranslation';

export const usePayments = () => {
  const { t } = useGlobalTranslation();
  const { translatePaymentData, isTranslating } = useDynamicTranslation();
  const [activeTab, setActiveTab] = useState(TAB_TYPES.PENDING);
  const [translatedTransactions, setTranslatedTransactions] = useState({
    pending: [],
    completed: []
  });

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

  // Translate transactions when language changes
  const translateTransactions = useCallback(async () => {
    try {
      console.log('🔄 Translating payment transactions...');
      
      // Translate pending transactions
      const translatedPending = await translatePaymentData(PENDING_TRANSACTIONS);
      
      // Translate completed transactions  
      const translatedCompleted = await translatePaymentData(COMPLETED_TRANSACTIONS);
      
      setTranslatedTransactions({
        pending: translatedPending,
        completed: translatedCompleted
      });
      
      console.log('✅ Payment transactions translated successfully');
    } catch (error) {
      console.error('❌ Failed to translate transactions:', error);
      // Fallback to original data
      setTranslatedTransactions({
        pending: PENDING_TRANSACTIONS,
        completed: COMPLETED_TRANSACTIONS
      });
    }
  }, [translatePaymentData]);

  // Get current transactions based on active tab
  const getCurrentTransactions = useCallback(() => {
    const hasTranslatedData = translatedTransactions.pending.length > 0 || translatedTransactions.completed.length > 0;
    
    if (hasTranslatedData) {
      return activeTab === TAB_TYPES.PENDING 
        ? translatedTransactions.pending 
        : translatedTransactions.completed;
    }
    
    // Fallback to original data
    return activeTab === TAB_TYPES.PENDING 
      ? PENDING_TRANSACTIONS 
      : COMPLETED_TRANSACTIONS;
  }, [activeTab, translatedTransactions]);

  // Translate transactions when component mounts or language changes
  useEffect(() => {
    translateTransactions();
  }, [translateTransactions]);

  return {
    activeTab,
    handleTabChange,
    handleWithdraw,
    handleTransactionPress,
    getCurrentTransactions,
    isTranslating,
    translateTransactions,
  };
};
