import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { usePayments } from './hooks';
import { WALLET_DATA } from './constants';
import {
  WalletSummary,
  Tabs,
  TransactionList,
} from './components';

const PaymentsScreen = ({ navigation }) => {
  const {
    activeTab,
    handleTabChange,
    handleWithdraw,
    handleTransactionPress,
  } = usePayments();

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <View style={styles.content}>
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
        />
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});

export default PaymentsScreen;
