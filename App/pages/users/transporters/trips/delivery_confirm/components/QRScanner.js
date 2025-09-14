import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const QRScanner = ({ isScanning, onScanComplete }) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cornerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isScanning) {
      // Scanning line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
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
        ])
      ).start();

      // Corner animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(cornerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScanning]);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });

  const cornerOpacity = cornerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.scannerContainer}
      >
        <View style={styles.scannerFrame}>
          {/* Scan overlay */}
          <Animated.View
            style={[
              styles.scanOverlay,
              {
                transform: [{ scaleY: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(59, 130, 246, 0.2)', 'transparent']}
              style={styles.gradientOverlay}
            />
          </Animated.View>

          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', '#3B82F6', 'transparent']}
              style={styles.scanLineGradient}
            />
          </Animated.View>

          {/* Corner indicators */}
          <Animated.View
            style={[
              styles.corner,
              styles.topLeft,
              { opacity: cornerOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.corner,
              styles.topRight,
              { opacity: cornerOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.corner,
              styles.bottomLeft,
              { opacity: cornerOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.corner,
              styles.bottomRight,
              { opacity: cornerOpacity },
            ]}
          />

          {/* Center content */}
          <View style={styles.centerContent}>
            <Icon name="qr-code-scanner" size={48} color="#FFFFFF" />
            <Text style={styles.instructionText}>Position QR code within frame</Text>
            <Text style={styles.subText}>Auto-scan enabled</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scannerContainer: {
    borderRadius: 12,
    padding: 20,
  },
  scannerFrame: {
    aspectRatio: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  scanLineGradient: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  centerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
  },
  subText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 4,
  },
});

export default QRScanner;
