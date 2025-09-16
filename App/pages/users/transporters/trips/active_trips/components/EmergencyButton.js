import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEmergencyActions } from '../hooks';

const EmergencyButton = () => {
  const { handleEmergencyCall } = useEmergencyActions();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergencyCall}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Icon name="alert" size={16} color="#FFFFFF" />
          <Text style={styles.emergencyText}>Emergency</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.helpText}>Tap for immediate assistance</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default EmergencyButton;
