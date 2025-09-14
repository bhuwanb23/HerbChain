import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
          <Text style={styles.emergencyIcon}>⚠️</Text>
          <Text style={styles.emergencyText}>Emergency Help</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.helpText}>Tap for immediate assistance</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emergencyIcon: {
    fontSize: 20,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default EmergencyButton;
