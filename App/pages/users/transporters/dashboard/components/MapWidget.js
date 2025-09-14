import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapWidget = ({ mapData, isExpanded, onToggleExpanded }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for live indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={onToggleExpanded}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapGradient}
        >
          {/* Decorative elements */}
          <View style={styles.decorativePattern} />
          
          <View style={styles.mapHeader}>
            <View style={styles.mapTitleSection}>
              <View style={styles.titleIconContainer}>
                <Icon name="map" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.mapTitle}>Live Route</Text>
              <Animated.View 
                style={[
                  styles.liveIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </Animated.View>
            </View>
            <View style={styles.expandButton}>
              <Icon 
                name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#6B7280" 
              />
            </View>
          </View>
          
          <View style={styles.mapContent}>
            <View style={styles.locationInfo}>
              <View style={styles.currentLocation}>
                <View style={styles.locationIconContainer}>
                  <Icon name="my-location" size={18} color="#22c55e" />
                </View>
                <Text style={styles.locationText}>{mapData.currentLocation.address}</Text>
              </View>
              
              <View style={styles.routeProgress}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={['#3B82F6', '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressFill, 
                        { width: `${mapData.routeProgress}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{mapData.routeProgress}% Complete</Text>
                </View>
              </View>
              
              <View style={styles.nextStop}>
                <View style={styles.nextStopIconContainer}>
                  <Icon name="place" size={18} color="#3B82F6" />
                </View>
                <View style={styles.nextStopInfo}>
                  <Text style={styles.nextStopAddress}>{mapData.nextStop.address}</Text>
                  <Text style={styles.nextStopDetails}>
                    {mapData.nextStop.distance} • ETA: {mapData.nextStop.eta}
                  </Text>
                </View>
              </View>
            </View>
            
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.mapPlaceholder}>
                  <LinearGradient
                    colors={['#F1F5F9', '#E2E8F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mapPlaceholderGradient}
                  >
                    <Icon name="map" size={48} color="#94A3B8" />
                    <Text style={styles.mapPlaceholderText}>Interactive Map View</Text>
                    <Text style={styles.mapPlaceholderSubtext}>Tap to open full map</Text>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16, // Reduced margin to minimize spacing
  },
  mapContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mapGradient: {
    padding: 18,
    position: 'relative',
  },
  decorativePattern: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  mapTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    padding: 6,
    marginRight: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 12,
    letterSpacing: 0.3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  expandButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 8,
    padding: 4,
  },
  mapContent: {
    flex: 1,
    zIndex: 1,
  },
  locationInfo: {
    gap: 12,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
  routeProgress: {
    marginVertical: 8,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  nextStop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextStopIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
    marginTop: 2,
  },
  nextStopInfo: {
    flex: 1,
  },
  nextStopAddress: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  nextStopDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholderGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default MapWidget;
