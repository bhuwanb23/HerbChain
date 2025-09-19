import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ACCOUNT_SETTINGS, SUPPORT_LEGAL_SETTINGS, COLORS } from '../constants';

const SettingItem = ({ setting, onPress }) => {
  return (
    <Pressable 
      onPress={() => onPress(setting.action)} 
      style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={setting.icon} size={20} color={setting.iconColor} />
        <Text style={styles.settingText}>{setting.title}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
    </Pressable>
  );
};

const ProfileCard = ({ profileData, isLoading }) => {
  // Show loading state
  if (isLoading || !profileData) {
    return (
      <View style={styles.profileCard}>
        <View style={[styles.profileImage, styles.loadingImage]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <Text style={styles.profileName}>Loading...</Text>
        <Text style={styles.profileRole}>Please wait</Text>
        <Text style={styles.profileEmail}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.profileCard}>
      <Image
        source={{ uri: profileData.imageUrl || 'https://via.placeholder.com/80' }}
        style={styles.profileImage}
      />
      <Text style={styles.profileName}>{profileData.name || 'Unknown User'}</Text>
      <Text style={styles.profileRole}>{profileData.labName || profileData.role || 'Lab User'}</Text>
      <Text style={styles.profileEmail}>{profileData.email || 'No email'}</Text>
    </View>
  );
};

const SettingsSection = ({ title, settings, onSettingPress }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {settings.map((setting) => (
        <SettingItem 
          key={setting.id} 
          setting={setting} 
          onPress={onSettingPress}
        />
      ))}
    </View>
  );
};

const LogoutButton = ({ onLogout }) => {
  return (
    <View style={styles.logoutSection}>
      <Pressable 
        onPress={onLogout} 
        style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
      >
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>
  );
};

const ProfileSettings = ({ 
  profileData,
  isLoading,
  onEditProfile,
  onChangePassword,
  onLanguageChange,
  onNotificationSettings,
  onCertificationUploads,
  onSupport,
  onPrivacyPolicy,
  onLogout,
}) => {
  const handleSettingPress = (action) => {
    switch (action) {
      case 'editProfile':
        onEditProfile();
        break;
      case 'changePassword':
        onChangePassword();
        break;
      case 'languageChange':
        onLanguageChange();
        break;
      case 'notificationSettings':
        onNotificationSettings();
        break;
      case 'certificationUploads':
        onCertificationUploads();
        break;
      case 'support':
        onSupport();
        break;
      case 'privacyPolicy':
        onPrivacyPolicy();
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <ScrollView style={styles.mainContent}>
      <ProfileCard profileData={profileData} isLoading={isLoading} />
      
      <SettingsSection 
        title="Account Settings"
        settings={ACCOUNT_SETTINGS}
        onSettingPress={handleSettingPress}
      />
      
      <SettingsSection 
        title="Support & Legal"
        settings={SUPPORT_LEGAL_SETTINGS}
        onSettingPress={handleSettingPress}
      />
      
      <LogoutButton onLogout={onLogout} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.8,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  loadingImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#111827',
  },
  logoutSection: {
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
});

export default ProfileSettings;