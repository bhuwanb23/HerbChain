import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QUICK_ACTIONS } from '../constants';

const QuickActions = ({ onQRScan, onBatchIDEntry }) => {
  const handleAction = (action) => {
    switch (action) {
      case 'scan':
        onQRScan && onQRScan();
        break;
      case 'manual':
        onBatchIDEntry && onBatchIDEntry();
        break;
      default:
        console.log(`Action ${action} not implemented`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.quickActionButton,
              action.id === 'qr_scan' ? styles.primaryBg : styles.whiteBg,
              action.id === 'batch_id' && styles.cardBorder,
            ]}
            onPress={() => handleAction(action.action)}
            activeOpacity={0.8}
          >
            <Icon 
              name={action.icon} 
              size={28} 
              color={action.id === 'qr_scan' ? '#FFFFFF' : '#808080'} 
            />
            <Text style={[
              styles.quickActionButtonText,
              action.id === 'qr_scan' ? styles.primaryText : styles.grayText
            ]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  primaryBg: {
    backgroundColor: '#00BFFF',
  },
  whiteBg: {
    backgroundColor: '#FFFFFF',
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  grayText: {
    color: '#4B5563',
  },
});

export default QuickActions;
