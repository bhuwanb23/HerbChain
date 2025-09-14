import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { REGISTRATION_STEPS, STEP_LABELS } from '../constants';

const ProgressBar = ({ currentStep }) => {
  const progressPercentage = (currentStep / REGISTRATION_STEPS.COMPLETE) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressInfo}>
        <Text style={styles.stepText}>
          Step {currentStep} of {REGISTRATION_STEPS.COMPLETE}
        </Text>
        <Text style={styles.stepLabel}>
          {STEP_LABELS[currentStep]}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stepLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
});

export default ProgressBar;
