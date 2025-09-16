import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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

  // Try to load MapView dynamically so the app doesn't break if the lib isn't installed
  let MapView, Polyline, Marker;
  try {
    // eslint-disable-next-line global-require
    MapView = require('react-native-maps').default;
    // eslint-disable-next-line global-require
    Polyline = require('react-native-maps').Polyline;
    // eslint-disable-next-line global-require
    Marker = require('react-native-maps').Marker;
  } catch (e) {
    MapView = null;
  }

  const defaultRegion = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  const hasRoute = Array.isArray(ROUTE_DATA?.coordinates) && ROUTE_DATA.coordinates.length > 1;
  const origin = hasRoute ? ROUTE_DATA.coordinates[0] : { latitude: 28.62, longitude: 77.2 };
  const destination = hasRoute ? ROUTE_DATA.coordinates[ROUTE_DATA.coordinates.length - 1] : { latitude: 28.6, longitude: 77.22 };

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

      {/* Map View */}
      <View style={styles.mapWrapper}>
        {MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              ...(hasRoute ? origin : defaultRegion),
              latitudeDelta: hasRoute ? 0.08 : defaultRegion.latitudeDelta,
              longitudeDelta: hasRoute ? 0.08 : defaultRegion.longitudeDelta,
            }}
            pointerEvents={mapView === 'expanded' ? 'auto' : 'auto'}
          >
            {hasRoute && (
              <Polyline
                coordinates={ROUTE_DATA.coordinates}
                strokeColor="#10b981"
                strokeWidth={4}
              />
            )}
            <Marker coordinate={origin} title="Origin" />
            <Marker coordinate={destination} title="Destination" />
          </MapView>
        ) : (
          <LinearGradient
            colors={['#E5F9F1', '#ECFDF5']}
            style={styles.mapFallback}
          >
            <Icon name="map" size={28} color="#059669" />
            <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
          </LinearGradient>
        )}

        {/* Floating map controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleLocationPress} style={styles.controlBtn} activeOpacity={0.8}>
            <Icon name="crosshairs-gps" size={18} color="#065F46" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExpandPress} style={styles.controlBtn} activeOpacity={0.8}>
            <Icon name={mapView === 'expanded' ? 'fullscreen-exit' : 'fullscreen'} size={18} color="#065F46" />
          </TouchableOpacity>
        </View>
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
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallbackText: {
    marginTop: 6,
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    right: 8,
    top: 8,
    gap: 8,
  },
  controlBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: '#10b981',
    borderRadius: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
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
