import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const WithdrawButton = ({ availableAmount, onWithdraw }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.withdrawButton}
        onPress={() => onWithdraw && onWithdraw()}
        activeOpacity={0.8}
      >
        <Text style={styles.withdrawIcon}>📥</Text>
        <Text style={styles.withdrawText}>
          Withdraw ₹{availableAmount?.toLocaleString() || '21,340'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WithdrawButton;
