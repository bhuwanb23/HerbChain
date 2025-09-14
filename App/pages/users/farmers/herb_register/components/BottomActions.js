import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REGISTRATION_STEPS } from '../constants';

const BottomActions = ({ currentStep, onGenerateBatch, isProcessing }) => {
  const insets = useSafeAreaInsets();

  const getButtonContent = () => {
    if (currentStep === REGISTRATION_STEPS.COMPLETE) {
      return (
        <>
          <Icon name="check" size={20} color="white" />
          <Text style={styles.buttonText}>Batch ID: HRB-2024-001523</Text>
        </>
      );
    }

    return (
      <>
        <Icon name="qr-code" size={20} color="white" />
        <Text style={styles.buttonText}>Generate Batch ID</Text>
      </>
    );
  };

  const getButtonStyle = () => {
    if (currentStep === REGISTRATION_STEPS.COMPLETE) {
      return [styles.button, styles.completedButton];
    }
    return styles.button;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onGenerateBatch}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {getButtonContent()}
      </TouchableOpacity>
      
      <Text style={styles.helpText}>
        This will create a unique identifier for tracking
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completedButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BottomActions;
