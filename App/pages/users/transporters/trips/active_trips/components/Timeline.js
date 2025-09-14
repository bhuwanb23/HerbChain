import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTripAnimations } from '../hooks';

const Timeline = ({ timelineData }) => {
  const { pulseAnim, glowAnim } = useTripAnimations();

  const getEventColor = (event) => {
    if (event.completed) {
      return '#10b981';
    } else if (event.isCurrent) {
      return '#3B82F6';
    } else {
      return '#D1D5DB';
    }
  };

  const getEventIcon = (event) => {
    if (event.completed) {
      return '✅';
    } else if (event.isCurrent) {
      return '📍';
    } else {
      return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      
      <View style={styles.eventsList}>
        {timelineData.map((event, index) => {
          const isLast = index === timelineData.length - 1;
          const eventColor = getEventColor(event);
          const eventIcon = getEventIcon(event);
          
          return (
            <View key={event.id} style={styles.eventItem}>
              <Animated.View style={[
                styles.eventDot,
                { backgroundColor: eventColor },
                event.isCurrent && {
                  transform: [{ scale: pulseAnim }],
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }
              ]}>
                <Text style={styles.dotIcon}>{eventIcon}</Text>
              </Animated.View>
              
              <View style={[styles.eventContent, isLast && styles.lastEvent]}>
                <View style={styles.eventHeader}>
                  <Text style={[
                    styles.eventTitle,
                    event.completed && styles.completedTitle,
                    event.isCurrent && styles.currentTitle,
                  ]}>
                    {event.title}
                  </Text>
                  <Text style={[
                    styles.eventTime,
                    event.isCurrent && styles.currentTime,
                  ]}>
                    {event.time}
                  </Text>
                </View>
              </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  eventsList: {
    gap: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  eventDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dotIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  eventContent: {
    flex: 1,
    paddingTop: 4,
  },
  lastEvent: {
    paddingBottom: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  completedTitle: {
    color: '#10b981',
  },
  currentTitle: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  currentTime: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default Timeline;
