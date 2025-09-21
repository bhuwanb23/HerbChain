import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const WalletSummary = ({ walletData, onWithdrawPress }) => {
  const { t } = useGlobalTranslation();
  
  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.header}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>{t.farmerPayments?.totalBalance || 'Total Balance'}</Text>
          <Text style={styles.balanceAmount}>{walletData.totalBalance}</Text>
        </View>
        <View style={styles.walletIcon}>
          <Icon name="account-balance-wallet" size={24} color="white" />
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t.farmerPayments?.incentivesEarned || 'Incentives Earned'}</Text>
          <Text style={styles.statValue}>{walletData.incentivesEarned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t.farmerPayments?.thisMonth || 'This Month'}</Text>
          <Text style={styles.statValue}>{walletData.monthlyEarnings}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.withdrawButton}
        onPress={onWithdrawPress}
        activeOpacity={0.8}
      >
        <Icon name="account-balance" size={20} color="#10B981" />
        <Text style={styles.withdrawText}>{t.farmerPayments?.withdrawToBank || 'Withdraw to Bank'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  balanceSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  walletIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  withdrawButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  withdrawText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
});

export default WalletSummary;
