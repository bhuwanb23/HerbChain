import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ScannerControls = ({ onManualEntry, onFlashlightToggle }) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, []);

  const handleFlashlightToggle = () => {
    setFlashlightOn(!flashlightOn);
    onFlashlightToggle(!flashlightOn);
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Manual Entry',
      'Enter batch code manually:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enter', onPress: (code) => code && onManualEntry(code) },
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.controlsContainer}>
      {/* Flashlight Button */}
      <TouchableOpacity
        style={styles.flashlightButton}
        onPress={handleFlashlightToggle}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={flashlightOn ? ['#fbbf24', '#f59e0b'] : ['#374151', '#1f2937']}
            style={styles.flashlightGradient}
          >
            <Icon 
              name={flashlightOn ? "flashlight-on" : "flashlight-off"} 
              size={20} 
              color="white" 
            />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Manual Entry Button */}
      <TouchableOpacity
        style={styles.manualEntryButton}
        onPress={handleManualEntry}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.manualEntryGradient}
        >
          <Icon name="keyboard" size={16} color="white" style={styles.manualIcon} />
          <Text style={styles.manualText}>Manual Entry</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  flashlightButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  flashlightGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualEntryButton: {
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  manualEntryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  manualIcon: {
    marginRight: 8,
  },
  manualText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ScannerControls;
