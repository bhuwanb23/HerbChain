import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
              <Icon
                name={button.id === 'contact' ? 'phone' : button.id === 'share' ? 'share-variant' : 'truck-check-outline'}
                size={16}
                color={button.type === 'primary' ? '#FFFFFF' : '#065F46'}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.buttonText,
                  button.type === 'primary' && styles.primaryText,
                ]}
              >
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1FAE5',
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    shadowColor: '#059669',
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
  primaryIcon: {
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    maxWidth: 120,
  },
  primaryText: {
    color: '#FFFFFF',
  },
});

export default ActionBar;
