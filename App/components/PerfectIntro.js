import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSpacer from './BottomSpacer';

const { width, height } = Dimensions.get('window');

const PerfectIntro = ({ onAnimationComplete }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start the animation sequence
    Animated.sequence([
      // Logo entrance with dramatic effect
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Tagline slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
    ]).start(() => {
      // Animation complete, call callback after delay
      setTimeout(() => {
        onAnimationComplete();
      }, 800);
    });
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom + 20, // Extra bottom padding
    }]}>
      {/* Background with gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Floating decorative elements */}
      <Animated.View
        style={[
          styles.floatingLeaf1,
          {
            opacity: fadeAnim,
            transform: [
              { rotate: rotateInterpolate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={styles.leaf}>🍃</Text>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.floatingLeaf2,
          {
            opacity: fadeAnim,
            transform: [
              { rotate: rotateInterpolate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={styles.leaf}>🌿</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.floatingLeaf3,
          {
            opacity: fadeAnim,
            transform: [
              { rotate: rotateInterpolate },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <Text style={styles.leaf}>🌱</Text>
      </Animated.View>

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <Text style={styles.logoText}>🌿</Text>
          <Text style={styles.brandName}>HerbChain</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.tagline}>From Roots to Remedies</Text>
          <Text style={styles.subTagline}>Traced with Trust</Text>
        </Animated.View>

        {/* Loading animation */}
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.dot, styles.dot1, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, styles.dot2, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.dot, styles.dot3, { opacity: fadeAnim }]} />
        </View>

        {/* Bottom Spacer for Navigation Bar */}
        <BottomSpacer extraPadding={30} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F5E8',
  },
  floatingLeaf1: {
    position: 'absolute',
    top: height * 0.12,
    left: width * 0.08,
  },
  floatingLeaf2: {
    position: 'absolute',
    top: height * 0.18,
    right: width * 0.1,
  },
  floatingLeaf3: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.15,
  },
  leaf: {
    fontSize: 35,
    opacity: 0.4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 90,
    marginBottom: 15,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  brandName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2E7D32',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subTagline: {
    fontSize: 18,
    color: '#66BB6A',
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginHorizontal: 6,
  },
  dot1: {
    backgroundColor: '#4CAF50',
  },
  dot2: {
    backgroundColor: '#66BB6A',
  },
  dot3: {
    backgroundColor: '#81C784',
  },
});

export default PerfectIntro;
