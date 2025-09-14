import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REGISTRATION_STEPS } from '../constants';

const BottomActions = ({ currentStep, onGenerateBatch, isProcessing }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for processing
    if (isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  const getButtonContent = () => {
    if (currentStep === REGISTRATION_STEPS.COMPLETE) {
      return (
        <View style={styles.buttonContent}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" size={24} color="white" />
            <View style={styles.successRing} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>Batch ID Generated!</Text>
            <Text style={styles.batchIdText}>HRB-2024-001523</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        <View style={styles.iconContainer}>
          <Icon name="qr-code" size={24} color="white" />
          {isProcessing && <View style={styles.processingRing} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>
            {isProcessing ? 'Generating...' : 'Generate Batch ID'}
          </Text>
          {/* <Text style={styles.buttonSubtext}>
            {isProcessing ? 'Creating unique identifier' : 'Tap to create tracking ID'}
          </Text> */}
        </View>
      </View>
    );
  };

  const getGradientColors = () => {
    if (currentStep === REGISTRATION_STEPS.COMPLETE) {
      return ['#10b981', '#059669'];
    }
    if (isProcessing) {
      return ['#3b82f6', '#1d4ed8'];
    }
    return ['#22c55e', '#16a34a'];
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.button}
          onPress={onGenerateBatch}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {getButtonContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.helpContainer}>
        <Icon name="info" size={16} color="#6b7280" />
        <Text style={styles.helpText}>
          {currentStep === REGISTRATION_STEPS.COMPLETE 
            ? 'Your batch is ready for tracking' 
            : 'create a unique identifier for tracking'
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  successIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  successRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  processingRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 1,
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  batchIdText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});

export default BottomActions;
