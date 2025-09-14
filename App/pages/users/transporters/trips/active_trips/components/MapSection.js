import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTE_DATA } from '../constants';
import { useTripAnimations, useMapControls } from '../hooks';

const MapSection = ({ tripData, onMapControlPress }) => {
  const { pulseAnim, glowAnim, routeAnim } = useTripAnimations();
  const { mapView, isTrackingLocation, centerOnLocation, toggleMapView } = useMapControls();

  const handleLocationPress = () => {
    centerOnLocation();
    if (onMapControlPress) {
      onMapControlPress('location');
    }
  };

  const handleExpandPress = () => {
    toggleMapView();
    if (onMapControlPress) {
      onMapControlPress('expand');
    }
  };

  return (
    <View style={styles.container}>
      {/* Live Tracking Indicator */}
      <View style={styles.liveTrackingContainer}>
        <Animated.View style={[
          styles.liveTrackingBadge,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          }
        ]}>
          <Animated.View style={[
            styles.liveDot,
            {
              transform: [{ scale: pulseAnim }],
            }
          ]} />
          <Text style={styles.liveText}>Live Tracking</Text>
        </Animated.View>
      </View>

      {/* ETA Information Card */}
      <View style={styles.etaInfoContainer}>
        <View style={styles.etaCard}>
          <View style={styles.etaRow}>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Duration</Text>
            </View>
          </View>
        </View>
        
        {/* Route Progress Line */}
        <View style={styles.routeProgressContainer}>
          <View style={styles.routeLine} />
          <Animated.View 
            style={[
              styles.progressDot,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }
            ]}
          />
        </View>

        {/* Target Icon */}
        <View style={styles.targetIcon}>
          <Text style={styles.targetEmoji}>🎯</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveTrackingContainer: {
    marginBottom: 12,
  },
  liveTrackingBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  etaInfoContainer: {
    position: 'relative',
  },
  etaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  etaItem: {
    alignItems: 'center',
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  routeProgressContainer: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  targetIcon: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetEmoji: {
    fontSize: 16,
  },
});

export default MapSection;
