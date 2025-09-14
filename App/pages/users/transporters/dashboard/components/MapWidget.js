import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapWidget = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="location-on" size={20} color="#3B82F6" />
            <Text style={styles.title}>Live Tracking</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Image
            source={{
              uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/82c83a9181-2458dae4751cb0efd8b5.png',
            }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          
          <Animated.View
            style={[
              styles.liveIndicator,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.indicatorGradient}
            >
              <Text style={styles.indicatorText}>3 Active Routes</Text>
            </LinearGradient>
          </Animated.View>

          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  mapContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  indicatorGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    opacity: 0.7,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    opacity: 0.8,
  },
});

export default MapWidget;