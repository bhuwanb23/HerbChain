import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ACTION_BUTTONS } from '../constants';
import { useEmergencyActions } from '../hooks';

const ActionBar = ({ onDeliveryReady }) => {
  const { handleContactDispatch, handleShareLocation } = useEmergencyActions();

  const handleButtonPress = (buttonId) => {
    switch (buttonId) {
      case 'contact':
        handleContactDispatch();
        break;
      case 'share':
        handleShareLocation();
        break;
      case 'delivery':
        // Handle delivery ready action
        if (onDeliveryReady) {
          onDeliveryReady({
            name: 'Dr. Sarah Chen',
            department: 'Processing Lab',
            id: 'LAB-2024-SC'
          });
        }
        break;
      default:
        console.log(`Button ${buttonId} pressed`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {ACTION_BUTTONS.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={[
              styles.actionButton,
              button.type === 'primary' ? styles.primaryButton : styles.secondaryButton,
            ]}
            onPress={() => handleButtonPress(button.id)}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <Text style={[
                styles.buttonIcon,
                button.type === 'primary' && styles.primaryIcon,
              ]}>
                {button.icon}
              </Text>
              <Text style={[
                styles.buttonText,
                button.type === 'primary' && styles.primaryText,
              ]}>
                {button.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonIcon: {
    fontSize: 14,
    color: '#6B7280',
  },
  primaryIcon: {
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  primaryText: {
    color: '#FFFFFF',
  },
});

export default ActionBar;
