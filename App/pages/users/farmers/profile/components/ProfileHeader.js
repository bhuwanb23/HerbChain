import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';

const ProfileHeader = ({ profileData, isLoading }) => {
  const handleCameraPress = () => {
    Alert.alert('Change Photo', 'Camera functionality will be implemented');
  };

  // Show loading state
  if (isLoading || !profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <View style={[styles.profileImage, styles.loadingImage]}>
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          </View>
          <Text style={styles.profileName}>Loading...</Text>
          <Text style={styles.profileTitle}>Please wait</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: profileData.imageUrl || 'https://via.placeholder.com/72' }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
            activeOpacity={0.7}
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{profileData.name || 'Unknown User'}</Text>
        <Text style={styles.profileTitle}>{profileData.title || 'User'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22c55e',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraIcon: {
    fontSize: 10,
    color: 'white',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ProfileHeader;
