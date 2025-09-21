import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const ProgressBar = ({ currentStep, steps }) => {
  const { t } = useGlobalTranslation();
  
  // Translate step labels
  const getTranslatedLabel = (stepId) => {
    switch (stepId) {
      case 1:
        return t.production?.selectHerbs || 'Select Herbs';
      case 2:
        return t.production?.formulation || 'Formulation';
      case 3:
        return t.production?.linkBatchesStep || 'Link Batches';
      case 4:
        return t.production?.generateQR || 'Generate QR';
      default:
        return `${t.production?.step || 'Step'} ${stepId}`;
    }
  };
  
  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={styles.stepIndicatorWrapper}>
            <View
              style={[
                styles.stepIndicator,
                currentStep > step.id && styles.completedStepIndicator,
                currentStep === step.id && styles.currentStepIndicator,
              ]}
            >
              {currentStep > step.id ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepText,
                    currentStep > step.id && styles.completedStepText,
                    currentStep === step.id && styles.currentStepText,
                  ]}
                >
                  {step.id}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                currentStep > step.id && styles.completedStepLabel,
                currentStep === step.id && styles.currentStepLabel,
              ]}
            >
              {getTranslatedLabel(step.id)}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={styles.progressBarWrapper}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: currentStep > step.id ? '100%' : '0%' },
                ]}
              />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
  },
  stepIndicator: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 9999, // rounded-full
    backgroundColor: '#e5e7eb', // gray-200
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  completedStepIndicator: {
    backgroundColor: '#059669', // primary
  },
  currentStepIndicator: {
    backgroundColor: '#059669', // primary
  },
  stepText: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    color: '#6b7280', // gray-500
  },
  completedStepText: {
    color: '#fff',
  },
  currentStepText: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  completedStepLabel: {
    color: '#059669',
  },
  currentStepLabel: {
    color: '#059669',
  },
  progressBarWrapper: {
    flex: 1,
    height: 2, // h-0.5
    backgroundColor: '#e5e7eb', // gray-200
    marginHorizontal: 8, // mx-2
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669', // primary
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
});

export default ProgressBar;