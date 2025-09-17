import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from './hooks';
import {
  ProfileSettings,
  SupportDispute,
} from './components';

const ProfilePage = ({ navigation }) => {
  const {
    currentTab,
    isLoading,
    handleTabChange,
    handleEditProfile,
    handleChangePassword,
    handleLanguageChange,
    handleNotificationSettings,
    handleCertificationUploads,
    handleSupport,
    handlePrivacyPolicy,
    handleLogout,
    handleSaveProfile,
    handleSubmitIssue,
    handleSubmitDispute,
  } = useProfile();

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <ProfileSettings 
            onEditProfile={handleEditProfile}
            onChangePassword={handleChangePassword}
            onLanguageChange={handleLanguageChange}
            onNotificationSettings={handleNotificationSettings}
            onCertificationUploads={handleCertificationUploads}
            onSupport={handleSupport}
            onPrivacyPolicy={handlePrivacyPolicy}
            onLogout={handleLogout}
          />
        );
      case 'support':
        return (
          <SupportDispute 
            onSubmitIssue={handleSubmitIssue}
            onSubmitDispute={handleSubmitDispute}
          />
        );
      default:
        return (
          <ProfileSettings 
            onEditProfile={handleEditProfile}
            onChangePassword={handleChangePassword}
            onLanguageChange={handleLanguageChange}
            onNotificationSettings={handleNotificationSettings}
            onCertificationUploads={handleCertificationUploads}
            onSupport={handleSupport}
            onPrivacyPolicy={handlePrivacyPolicy}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              currentTab === 'profile' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('profile')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={currentTab === 'profile' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'profile' && styles.activeTabButtonText
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              currentTab === 'support' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('support')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="help-circle-outline" 
              size={20} 
              color={currentTab === 'support' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'support' && styles.activeTabButtonText
              ]}
            >
              Support
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#006B38',
    shadowColor: '#006B38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ProfilePage;
