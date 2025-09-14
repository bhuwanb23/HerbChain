import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BatchInfo = ({ batchData, isVisible }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      ]).start();
    }
  }, [isVisible]);

  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideTranslateY }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Icon name="inventory" size={20} color="#EA580C" />
          <Text style={styles.title}>Batch Details</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.label}>Batch ID:</Text>
            <Text style={styles.value}>{batchData.batchId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Handover Time:</Text>
            <Text style={styles.value}>{batchData.handoverTime}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Integrity Status:</Text>
            <View style={styles.statusContainer}>
              <Icon name="verified" size={16} color="#22C55E" />
              <Text style={styles.statusText}>Verified</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22C55E',
    marginLeft: 4,
  },
});

export default BatchInfo;
