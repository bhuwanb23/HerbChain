import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REGISTRATION_STEPS, STEP_LABELS } from '../constants';

const ProgressBar = ({ currentStep }) => {
  const progressPercentage = (currentStep / REGISTRATION_STEPS.COMPLETE) * 100;
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progressPercentage,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Pulse animation for active step
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [currentStep]);

  const getStepIcon = (step) => {
    switch (step) {
      case 1: return 'camera-alt';
      case 2: return 'edit';
      case 3: return 'check-circle';
      default: return 'radio-button-unchecked';
    }
  };

  return (
    <LinearGradient
      colors={['#f0fdf4', '#ecfdf5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.progressInfo}>
        <View style={styles.stepInfo}>
          <Animated.View style={[styles.stepIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Icon 
              name={getStepIcon(currentStep)} 
              size={20} 
              color={currentStep === REGISTRATION_STEPS.COMPLETE ? '#10b981' : '#22c55e'} 
            />
          </Animated.View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepText}>
              Step {currentStep} of {REGISTRATION_STEPS.COMPLETE}
            </Text>
            <Text style={styles.stepLabel}>
              {STEP_LABELS[currentStep]}
            </Text>
          </View>
        </View>
        
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{Math.round(progressPercentage)}%</Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: animatedWidth }
            ]} 
          />
        </View>
        
        {/* Step indicators */}
        <View style={styles.stepIndicators}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                step <= currentStep && styles.activeStepDot,
                step === currentStep && styles.currentStepDot,
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepLabel: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  percentageContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  percentageText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 6,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d1d5db',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeStepDot: {
    backgroundColor: '#22c55e',
  },
  currentStepDot: {
    backgroundColor: '#10b981',
    borderColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ProgressBar;
