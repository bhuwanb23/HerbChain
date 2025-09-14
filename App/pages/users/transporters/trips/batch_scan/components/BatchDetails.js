import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BatchDetails = ({ batchData, isVisible }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    outputRange: [20, 0],
  });

  if (!isVisible) return null;

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
        colors={['#ffffff', '#f9fafb']}
        style={styles.gradient}
      >
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.statusIndicator}>
            <Icon name="check-circle" size={16} color="#22c55e" />
          </View>
          <Text style={styles.statusText}>Scan Successful</Text>
        </View>

        {/* Batch Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Herb Type</Text>
            <Text style={styles.value}>{batchData.herbType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Batch ID</Text>
            <Text style={styles.value}>{batchData.batchId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Source Farmer</Text>
            <Text style={styles.value}>{batchData.sourceFarmer}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Timestamp</Text>
            <Text style={styles.value}>{batchData.timestamp}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gradient: {
    padding: 12,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803d',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
  },
});

export default BatchDetails;
