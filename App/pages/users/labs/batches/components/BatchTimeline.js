import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TIMELINE_STEPS } from '../constants';

const BatchTimeline = ({ currentStep = 'verification', progress = 25 }) => {
  const getStepStatus = (stepId) => {
    const stepIndex = TIMELINE_STEPS.findIndex(step => step.id === stepId);
    const currentIndex = TIMELINE_STEPS.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStepIcon = (step, status) => {
    if (status === 'completed') {
      return <Icon name="check" size={14} color="#FFFFFF" />;
    }
    // Map icon names to valid Material Icons
    const iconMap = {
      'checkmark': 'check',
      'flask': 'science',
      'shield-outline': 'security',
      'truck-outline': 'local-shipping'
    };
    const iconName = iconMap[step.icon] || step.icon;
    return <Icon name={iconName} size={14} color={status === 'active' ? '#FFFFFF' : '#9CA3AF'} />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batch Journey Timeline</Text>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine}></View>
        <View style={[styles.timelineProgress, { width: `${progress}%` }]}></View>
        
        {TIMELINE_STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <View key={step.id} style={styles.timelineStep}>
              <View style={[
                styles.timelineStepIcon,
                status === 'completed' && styles.timelineStepActiveIcon,
                status === 'active' && styles.timelineStepActiveIcon,
                status === 'pending' && styles.timelineStepInactiveIcon,
              ]}>
                {getStepIcon(step, status)}
              </View>
              <Text style={[
                styles.timelineStepText,
                status === 'active' && styles.timelineStepTextActive,
                status === 'completed' && styles.timelineStepTextCompleted,
              ]}>
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineProgress: {
    position: 'absolute',
    top: 16,
    left: 0,
    height: 2,
    backgroundColor: '#00BFFF',
  },
  timelineStep: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  timelineStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineStepActiveIcon: {
    backgroundColor: '#00BFFF',
  },
  timelineStepInactiveIcon: {
    backgroundColor: '#E5E7EB',
  },
  timelineStepText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  timelineStepTextActive: {
    color: '#00BFFF',
    fontWeight: '600',
  },
  timelineStepTextCompleted: {
    color: '#22C55E',
    fontWeight: '500',
  },
});

export default BatchTimeline;
