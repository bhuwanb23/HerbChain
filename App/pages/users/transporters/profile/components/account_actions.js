import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Row = ({ icon, label, rightIcon }) => (
  <TouchableOpacity style={styles.row} activeOpacity={0.7}>
    <View style={styles.rowLeft}>
      <Icon name={icon} size={18} color="#6B7280" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Icon name={rightIcon || 'chevron-right'} size={16} color="#9CA3AF" />
  </TouchableOpacity>
);

const AccountActions = () => {
  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        <Row icon="manage-accounts" label="Account Settings" />
        <Row icon="headset-mic" label="Help & Support" />
        <TouchableOpacity style={styles.logout} activeOpacity={0.8}>
          <Icon name="logout" size={18} color="#DC2626" style={styles.rowIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stack: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AccountActions;


