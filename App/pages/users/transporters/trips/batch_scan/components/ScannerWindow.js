import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const ScannerWindow = ({ isScanning, onScanComplete }) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

      // Pulse animation for corners
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
    }
  }, [isScanning]);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.7],
  });

  return (
    <View style={styles.scannerContainer}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.scannerFrame}
      >
        <View style={styles.scannerInner}>
          {/* Corner Brackets */}
          <Animated.View style={[styles.corner, styles.topLeft, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.corner, styles.topRight, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.corner, styles.bottomLeft, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.corner, styles.bottomRight, { transform: [{ scale: pulseAnim }] }]} />

          {/* Scanning Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineTranslateY }],
              },
            ]}
          />

          {/* Center Instructions */}
          <View style={styles.centerContent}>
            <Icon name="qr-code-scanner" size={48} color="rgba(255,255,255,0.6)" />
            <Text style={styles.instructionText}>Position QR code within frame</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  scannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scannerFrame: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scannerInner: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#4ade80',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4ade80',
    opacity: 0.8,
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ScannerWindow;
