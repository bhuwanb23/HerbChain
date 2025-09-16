import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TRIP_STATUS, STATUS_COLORS, STATUS_LABELS } from '../constants';
import { useTripAnimations } from '../hooks';

const TripStatus = ({ currentStatus }) => {
  const { glowAnim } = useTripAnimations();

  const statusSteps = [
    {
      id: TRIP_STATUS.PICKED_UP,
      label: STATUS_LABELS[TRIP_STATUS.PICKED_UP],
      icon: '📦',
      color: STATUS_COLORS[TRIP_STATUS.PICKED_UP],
      completed: true,
    },
    {
      id: TRIP_STATUS.IN_TRANSIT,
      label: STATUS_LABELS[TRIP_STATUS.IN_TRANSIT],
      icon: '🚚',
      color: STATUS_COLORS[TRIP_STATUS.IN_TRANSIT],
      completed: currentStatus === TRIP_STATUS.IN_TRANSIT || currentStatus === TRIP_STATUS.DELIVERED,
      isCurrent: currentStatus === TRIP_STATUS.IN_TRANSIT,
    },
    {
      id: TRIP_STATUS.DELIVERED,
      label: STATUS_LABELS[TRIP_STATUS.DELIVERED],
      icon: '🏁',
      color: STATUS_COLORS[TRIP_STATUS.DELIVERED],
      completed: currentStatus === TRIP_STATUS.DELIVERED,
    },
  ];

  const getStatusBadgeColor = () => {
    switch (currentStatus) {
      case TRIP_STATUS.PICKED_UP:
        return '#10b981';
      case TRIP_STATUS.IN_TRANSIT:
        return '#10b981';
      case TRIP_STATUS.DELIVERED:
        return '#6B7280';
      default:
        return '#3B82F6';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Status</Text>
      
      <View style={styles.statusGrid}>
        {statusSteps.map((step, index) => (
          <Animated.View
            key={step.id}
            style={[
              styles.statusCard,
              step.completed && styles.completedCard,
              step.isCurrent && styles.currentCard,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: step.isCurrent ? [0.9, 1] : [0.8, 0.9],
                }),
              }
            ]}
          >
            <Animated.View style={[
              styles.statusIcon,
              {
                backgroundColor: step.completed ? step.color : '#F3F4F6',
                transform: step.isCurrent ? [{ scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                })}] : [{ scale: 1 }],
              }
            ]}>
              <Text style={[
                styles.iconText,
                { color: step.completed ? '#FFFFFF' : '#9CA3AF' }
              ]}>
                {step.icon}
              </Text>
            </Animated.View>
            <Text style={[
              styles.statusLabel,
              step.completed && styles.completedLabel,
              step.isCurrent && styles.currentLabel,
            ]}>
              {step.label}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* Current Status Badge */}
      <View style={styles.currentStatusContainer}>
        <View style={[styles.currentStatusBadge, { backgroundColor: getStatusBadgeColor() }]}>
          <Text style={styles.currentStatusText}>
            {STATUS_LABELS[currentStatus]}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  currentCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10b981',
    borderWidth: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 18,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  completedLabel: {
    color: '#10b981',
    fontWeight: '600',
  },
  currentLabel: {
    color: '#059669',
    fontWeight: '600',
  },
  currentStatusContainer: {
    alignItems: 'flex-end',
  },
  currentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TripStatus;
