import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ScanStatus = ({ isVisible, status }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'check-circle',
          text: 'QR Code detected',
          colors: ['#F0FDF4', '#22C55E'],
          textColor: '#15803D',
        };
      case 'error':
        return {
          icon: 'error',
          text: 'Scan failed',
          colors: ['#FEF2F2', '#EF4444'],
          textColor: '#DC2626',
        };
      default:
        return {
          icon: 'qr-code-scanner',
          text: 'Scanning...',
          colors: ['#EFF6FF', '#3B82F6'],
          textColor: '#2563EB',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideTranslateY },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={config.colors}
        style={styles.statusContainer}
      >
        <Icon name={config.icon} size={16} color={config.textColor} />
        <Text style={[styles.statusText, { color: config.textColor }]}>
          {config.text}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ScanStatus;
