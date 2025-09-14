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

const AuthenticationSection = ({ 
  selectedMethod, 
  onMethodSelect, 
  isVisible 
}) => {
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

  const AuthenticationButton = ({ 
    method, 
    icon, 
    title, 
    isSelected, 
    onPress 
  }) => {
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

    const getButtonStyle = () => {
      if (method === 'fingerprint') {
        return isSelected 
          ? ['#DBEAFE', '#BFDBFE'] 
          : ['#EFF6FF', '#DBEAFE'];
      } else {
        return isSelected 
          ? ['#F3F4F6', '#E5E7EB'] 
          : ['#F9FAFB', '#F3F4F6'];
      }
    };

    const getTextColor = () => {
      if (method === 'fingerprint') {
        return isSelected ? '#1D4ED8' : '#2563EB';
      } else {
        return isSelected ? '#374151' : '#6B7280';
      }
    };

    const getIconColor = () => {
      if (method === 'fingerprint') {
        return isSelected ? '#1D4ED8' : '#2563EB';
      } else {
        return isSelected ? '#374151' : '#6B7280';
      }
    };

    return (
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.button}
        >
          <LinearGradient
            colors={getButtonStyle()}
            style={styles.buttonGradient}
          >
            <Icon 
              name={icon} 
              size={24} 
              color={getIconColor()} 
            />
            <Text style={[styles.buttonText, { color: getTextColor() }]}>
              {title}
            </Text>
            {isSelected && (
              <View style={styles.checkmark}>
                <Icon name="check" size={16} color="#22C55E" />
              </View>
            )}
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
      <Text style={styles.title}>Authentication Required</Text>
      
      <View style={styles.buttonsContainer}>
        <AuthenticationButton
          method="fingerprint"
          icon="fingerprint"
          title="Fingerprint"
          isSelected={selectedMethod === 'fingerprint'}
          onPress={() => onMethodSelect('fingerprint')}
        />
        <AuthenticationButton
          method="signature"
          icon="edit"
          title="Signature"
          isSelected={selectedMethod === 'signature'}
          onPress={() => onMethodSelect('signature')}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthenticationSection;
