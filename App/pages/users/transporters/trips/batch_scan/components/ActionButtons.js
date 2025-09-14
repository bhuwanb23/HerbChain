import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ActionButtons = ({ isVisible, onAcceptBatch, onHandoverBatch }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
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
    outputRange: [30, 0],
  });

  if (!isVisible) return null;

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
      {/* Accept Batch Button */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={onAcceptBatch}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          style={styles.buttonGradient}
        >
          <Icon name="check" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Accept Batch</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Handover Batch Button */}
      <TouchableOpacity
        style={styles.handoverButton}
        onPress={onHandoverBatch}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ea580c', '#c2410c']}
          style={styles.buttonGradient}
        >
          <Icon name="handshake" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Handover Batch</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  acceptButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  handoverButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActionButtons;
