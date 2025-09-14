import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WalletSummary = ({ walletData, onWithdrawPress }) => {
  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.header}>
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{walletData.totalBalance}</Text>
        </View>
        <View style={styles.walletIcon}>
          <Icon name="account-balance-wallet" size={24} color="white" />
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Incentives Earned</Text>
          <Text style={styles.statValue}>{walletData.incentivesEarned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{walletData.monthlyEarnings}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.withdrawButton}
        onPress={onWithdrawPress}
        activeOpacity={0.8}
      >
        <Icon name="account-balance" size={20} color="#10B981" />
        <Text style={styles.withdrawText}>Withdraw to Bank</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  walletIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  withdrawButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
});

export default WalletSummary;
