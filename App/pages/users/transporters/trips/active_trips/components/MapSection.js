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
      <LinearGradient
        colors={['#EFF6FF', '#F0FDF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mapContainer}
      >
        {/* Map Background */}
        <View style={styles.mapBackground}>
          {/* Route Path */}
          <View style={styles.routeContainer}>
            <Animated.View 
              style={[
                styles.routeLine,
                {
                  opacity: routeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                }
              ]}
            />
          </View>

          {/* Checkpoints */}
          <View style={[styles.checkpoint, styles.startPoint]}>
            <View style={styles.checkpointInner} />
          </View>
          
          <View style={[styles.checkpoint, styles.waypoint]}>
            <View style={styles.checkpointInner} />
          </View>
          
          <View style={[styles.checkpoint, styles.endPoint]}>
            <View style={styles.checkpointInner} />
          </View>

          {/* Current Location Pulse */}
          <Animated.View 
            style={[
              styles.currentLocation,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              }
            ]}
          >
            <View style={styles.currentLocationInner} />
          </Animated.View>
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleLocationPress}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>🎯</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleExpandPress}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Live Status Indicator */}
        <View style={styles.liveStatusContainer}>
          <Animated.View style={[
            styles.liveStatus,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
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

        {/* ETA Info */}
        <View style={styles.etaContainer}>
          <View style={styles.etaCard}>
            <View style={styles.etaRow}>
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaValue}>{tripData.eta}</Text>
              </View>
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>Distance</Text>
                <Text style={styles.etaValue}>{tripData.distance}</Text>
              </View>
              <View style={styles.etaItem}>
                <Text style={styles.etaLabel}>Duration</Text>
                <Text style={styles.etaValue}>{tripData.duration}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  routeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  routeLine: {
    position: 'absolute',
    top: '50%',
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 1.5,
    transform: [{ rotate: '15deg' }],
  },
  checkpoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkpointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  startPoint: {
    top: '60%',
    left: '15%',
    backgroundColor: '#10b981',
  },
  waypoint: {
    top: '45%',
    left: '45%',
    backgroundColor: '#F59E0B',
  },
  endPoint: {
    top: '30%',
    right: '15%',
    backgroundColor: '#EF4444',
  },
  currentLocation: {
    position: 'absolute',
    top: '50%',
    left: '60%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlIcon: {
    fontSize: 16,
    color: '#3B82F6',
  },
  liveStatusContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  liveStatus: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  etaContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  etaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  etaItem: {
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
});

export default MapSection;
