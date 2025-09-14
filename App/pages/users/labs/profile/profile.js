import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  ProfileSettings,
  SupportDispute,
} from './components';

const ProfilePage = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState('profile');

  const handleSaveProfile = (profileData) => {
    console.log('Profile saved:', profileData);
    // Handle profile save
  };

  const handleSubmitIssue = (issueData) => {
    console.log('Issue submitted:', issueData);
    // Handle issue submission
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <ProfileSettings 
            onSaveProfile={handleSaveProfile}
          />
        );
      case 'support':
        return (
          <SupportDispute 
            onSubmitIssue={handleSubmitIssue}
          />
        );
      default:
        return (
          <ProfileSettings 
            onSaveProfile={handleSaveProfile}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <View
            style={[
              styles.tabButton,
              currentTab === 'profile' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'profile' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('profile')}
            >
              👤 Profile
            </Text>
          </View>
          <View
            style={[
              styles.tabButton,
              currentTab === 'support' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'support' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('support')}
            >
              🆘 Support
            </Text>
          </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#8B5CF6',
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
