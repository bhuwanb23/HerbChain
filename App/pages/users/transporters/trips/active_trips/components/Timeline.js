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
      
      <View style={styles.timelineContainer}>
        {/* Timeline Line */}
        <View style={styles.timelineLine} />
        
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
                  <Text style={[
                    styles.eventLocation,
                    event.completed && styles.completedLocation,
                    event.isCurrent && styles.currentLocation,
                  ]}>
                    {event.location}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  eventsList: {
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eventDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dotIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  eventContent: {
    flex: 1,
    paddingTop: 2,
  },
  lastEvent: {
    paddingBottom: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 12,
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
    fontSize: 10,
    color: '#6B7280',
  },
  currentTime: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 10,
    color: '#6B7280',
  },
  completedLocation: {
    color: '#10b981',
  },
  currentLocation: {
    color: '#3B82F6',
  },
});

export default Timeline;
