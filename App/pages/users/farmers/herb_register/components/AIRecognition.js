import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

const AIRecognition = ({ isProcessing, aiDetection, onCameraPress }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isProcessing) {
      // Spinning animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (aiDetection) {
      // Success animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Slide in animation for info cards
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [aiDetection]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const slideIn = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const handleAfterPick = async (uri) => {
    try {
      setSelectedImage(uri);
      // Request location and create dynamic detection data
      let coordsString = '';
      let readablePlace = '';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;
          coordsString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          const places = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (places && places.length > 0) {
            const p = places[0];
            readablePlace = [p.name, p.city, p.region, p.country].filter(Boolean).join(', ');
          }
        }
      } catch (_) {
        // ignore location errors and fall back to blanks
      }

      const detected = {
        species: 'Basil',
        confidence: 95,
        location: readablePlace || 'Near your current position',
        coordinates: coordsString,
        timestamp: new Date().toLocaleString(),
        image_uri: uri, // Include the image URI
      };
      // Trigger dummy AI recognition in hook with dynamic data
      await onCameraPress(detected);
    } catch (e) {
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const requestPermission = async (type) => {
    try {
      if (type === 'camera') {
        const perm = await ImagePicker.getCameraPermissionsAsync();
        if (perm.status !== 'granted' && perm.canAskAgain) {
          const res = await ImagePicker.requestCameraPermissionsAsync();
          return res.status === 'granted';
        }
        return perm.status === 'granted';
      }
      const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted' && perm.canAskAgain) {
        const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return res.status === 'granted';
      }
      return perm.status === 'granted';
    } catch (e) {
      return false;
    }
  };

  const pickFromCamera = async () => {
    const ok = await requestPermission('camera');
    if (!ok) {
      Alert.alert('Permission required', 'Camera permission is needed. Opening gallery instead.');
      await pickFromLibrary();
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await handleAfterPick(result.assets[0].uri);
      }
    } catch (e) {
      // Some environments (iOS Simulator) don't support camera; fallback to gallery
      try {
        await pickFromLibrary();
      } catch (_) {
        Alert.alert('Error', 'Unable to open camera or gallery');
      }
    }
  };

  const pickFromLibrary = async () => {
    const ok = await requestPermission('library');
    if (!ok) {
      Alert.alert('Permission required', 'Photo library permission is needed.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await handleAfterPick(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to open photo library');
    }
  };

  const renderCameraButton = () => {
    if (isProcessing) {
      return (
        <Animated.View 
          style={[
            styles.cameraButton,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon name="refresh" size={40} color="white" />
            </Animated.View>
            <Text style={styles.buttonTitle}>Processing...</Text>
            <Text style={styles.buttonSubtitle}>AI is analyzing the image</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    if (aiDetection) {
      return (
        <Animated.View 
          style={[
            styles.cameraButton,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Icon name="check-circle" size={40} color="white" />
            <Text style={styles.buttonTitle}>{aiDetection.species} Detected!</Text>
            <Text style={styles.buttonSubtitle}>Confidence: {aiDetection.confidence}%</Text>
            <View style={styles.successBadge}>
              <Icon name="star" size={16} color="#fbbf24" />
              <Text style={styles.badgeText}>AI Success</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    return (
      <View>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={pickFromCamera}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <View style={styles.cameraIconContainer}>
              <Icon name="camera-alt" size={40} color="white" />
              <View style={styles.cameraRing} />
            </View>
            <Text style={styles.buttonTitle}>Take Photo</Text>
            <Text style={styles.buttonSubtitle}>AI will identify the herb automatically</Text>
            <View style={styles.scanLines}>
              <View style={styles.scanLine} />
              <View style={styles.scanLine} />
              <View style={styles.scanLine} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={pickFromLibrary}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#e5e7eb', '#e5e7eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientButton, styles.secondaryGradient]}
          >
            <View style={styles.cameraIconContainer}>
              <Icon name="photo-library" size={28} color="#111827" />
            </View>
            <Text style={[styles.buttonTitle, { color: '#111827' }]}>Upload from Gallery</Text>
            <Text style={[styles.buttonSubtitle, { color: '#374151' }]}>Use existing photo</Text>
          </LinearGradient>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.iconContainer}
        >
          <Icon name="smart-toy" size={24} color="white" />
        </LinearGradient>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>AI Recognition</Text>
          <Text style={styles.sectionSubtitle}>Advanced herb identification</Text>
        </View>
      </View>

      <View style={styles.cameraSection}>
        {renderCameraButton()}
      </View>

      {aiDetection && (
        <Animated.View 
          style={[
            styles.autoFillSection,
            { transform: [{ translateY: slideIn }] }
          ]}
        >
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#eff6ff', '#dbeafe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.infoHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="location-on" size={20} color="#2563eb" />
                </View>
                <Text style={styles.infoTitle}>Auto-detected Location</Text>
              </View>
              <Text style={styles.infoText}>
                {aiDetection.location}, Coordinates: {aiDetection.coordinates}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#faf5ff', '#e9d5ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.infoHeader}>
                <View style={[styles.iconWrapper, styles.purpleIcon]}>
                  <Icon name="access-time" size={20} color="#9333ea" />
                </View>
                <Text style={[styles.infoTitle, styles.purpleText]}>Timestamp</Text>
              </View>
              <Text style={[styles.infoText, styles.purpleText]}>
                {aiDetection.timestamp}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cameraSection: {
    marginBottom: 24,
  },
  previewContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: Math.min(width - 48, 320),
    height: Math.min(width - 48, 320),
    borderRadius: 16,
  },
  cameraButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientButton: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  secondaryGradient: {
    paddingVertical: 18,
  },
  cameraIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  cameraRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  scanLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  scanLine: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  autoFillSection: {
    gap: 16,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  purpleIcon: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
  },
  purpleText: {
    color: '#7c3aed',
  },
  infoText: {
    fontSize: 15,
    color: '#1d4ed8',
    lineHeight: 22,
  },
});

export default AIRecognition;
