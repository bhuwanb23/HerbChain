import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WelcomeBanner = ({ transporterInfo }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for status badge
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Rotate animation for decorative elements
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Decorative animated elements */}
        <Animated.View 
          style={[
            styles.decorativeCircle1,
            { transform: [{ rotate: rotateInterpolate }] }
          ]}
        />
        <Animated.View 
          style={[
            styles.decorativeCircle2,
            { transform: [{ rotate: rotateInterpolate }] }
          ]}
        />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{transporterInfo.name}</Text>
              <Text style={styles.subtitle}>Ready to deliver excellence</Text>
            </View>
            <Animated.View 
              style={[
                styles.statusBadge,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Icon name="circle" size={8} color="#22c55e" />
              <Text style={styles.statusText}>{transporterInfo.status}</Text>
            </Animated.View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Icon name="directions-truck" size={20} color="#667eea" />
              </View>
              <Text style={styles.infoLabel}>Vehicle ID</Text>
              <Text style={styles.infoValue}>{transporterInfo.vehicleId}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Icon name="local-shipping" size={20} color="#667eea" />
              </View>
              <Text style={styles.infoLabel}>Active Trips</Text>
              <Text style={styles.infoValue}>{transporterInfo.activeTrips}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Icon name="star" size={20} color="#667eea" />
              </View>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{transporterInfo.rating}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 20,
    marginTop: 0, // Remove top margin to eliminate white space
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    padding: 20,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    color: 'white',
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 3,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default WelcomeBanner;
