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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(240, 253, 244, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 1,
  },
  percentageContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  percentageText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#e5e7eb',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2.5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2.5,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeStepDot: {
    backgroundColor: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  currentStepDot: {
    backgroundColor: '#10b981',
    borderColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default ProgressBar;
