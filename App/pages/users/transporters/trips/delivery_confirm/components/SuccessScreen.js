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

const SuccessScreen = ({ 
  transactionData, 
  onDownload, 
  onShare, 
  onNewHandover, 
  isVisible 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const ActionButton = ({ icon, title, onPress, isPrimary = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.actionButtonContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.actionButton}
        >
          <LinearGradient
            colors={isPrimary ? ['#2563EB', '#1D4ED8'] : ['#F3F4F6', '#E5E7EB']}
            style={styles.actionButtonGradient}
          >
            <Icon 
              name={icon} 
              size={20} 
              color={isPrimary ? '#FFFFFF' : '#374151'} 
            />
            <Text style={[
              styles.actionButtonText,
              { color: isPrimary ? '#FFFFFF' : '#374151' }
            ]}>
              {title}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
      {/* Success Icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7']}
          style={styles.iconGradient}
        >
          <Icon name="check" size={40} color="#22C55E" />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.title}>Handover Complete!</Text>
      <Text style={styles.subtitle}>Transaction recorded successfully</Text>

      {/* Receipt Summary */}
      <View style={styles.receiptContainer}>
        <View style={styles.receiptHeader}>
          <Icon name="receipt" size={20} color="#6B7280" />
          <Text style={styles.receiptTitle}>Receipt Summary</Text>
        </View>
        
        <View style={styles.receiptContent}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID:</Text>
            <Text style={styles.receiptValue}>{transactionData.transactionId}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date & Time:</Text>
            <Text style={styles.receiptValue}>{transactionData.dateTime}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>From:</Text>
            <Text style={styles.receiptValue}>{transactionData.from}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>To:</Text>
            <Text style={styles.receiptValue}>{transactionData.to}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Auth Method:</Text>
            <Text style={styles.receiptValue}>{transactionData.authMethod}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <ActionButton
          icon="download"
          title="Download"
          onPress={onDownload}
          isPrimary={true}
        />
        <ActionButton
          icon="share"
          title="Share"
          onPress={onShare}
          isPrimary={false}
        />
      </View>

      {/* New Handover Button */}
      <TouchableOpacity style={styles.newHandoverButton} onPress={onNewHandover}>
        <LinearGradient
          colors={['#4B5563', '#374151']}
          style={styles.newHandoverGradient}
        >
          <Text style={styles.newHandoverText}>New Handover</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  receiptContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  receiptContent: {
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  actionButtonContainer: {
    flex: 1,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  newHandoverButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newHandoverGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  newHandoverText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SuccessScreen;
