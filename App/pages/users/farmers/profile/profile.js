import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useProfile } from './hooks';
import {
  ProfileHeader,
  ProfileForm,
  AppSettings,
  ActionButtons,
  AppFooter,
} from './components';

const ProfileScreen = ({ navigation }) => {
  const { profileData, updateProfile } = useProfile();

  const handleSaveChanges = () => {
    // Handle save changes logic
    console.log('Profile saved');
  };

  const handleSignOut = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHeader profileData={profileData} />
        <ProfileForm 
          profileData={profileData} 
          onUpdateProfile={updateProfile} 
        />
        <AppSettings />
        <ActionButtons 
          onSaveChanges={handleSaveChanges}
          onSignOut={handleSignOut}
        />
        <AppFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to prevent content from going behind navbar
  },
});

export default ProfileScreen;
