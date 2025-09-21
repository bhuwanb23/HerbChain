import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { usePayments } from './hooks';
import { WALLET_DATA } from './constants';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import {
  WalletSummary,
  Tabs,
  TransactionList,
} from './components';

const PaymentsScreen = ({ navigation }) => {
  const { t } = useGlobalTranslation();
  const {
    activeTab,
    handleTabChange,
    handleWithdraw,
    handleTransactionPress,
    getCurrentTransactions,
    isTranslating,
  } = usePayments();

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WalletSummary 
          walletData={WALLET_DATA}
          onWithdrawPress={handleWithdraw}
        />
        
        <Tabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <TransactionList 
          activeTab={activeTab}
          onTransactionPress={handleTransactionPress}
          transactions={getCurrentTransactions()}
          isTranslating={isTranslating}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to prevent content from going behind navbar
  },
});

export default PaymentsScreen;
