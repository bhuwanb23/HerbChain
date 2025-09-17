import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export const useProfile = () => {
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = useCallback((tabId) => {
    setCurrentTab(tabId);
  }, []);

  const handleNavigation = useCallback((screenName) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screenName);
    }
  }, [navigation]);

  const handleEditProfile = useCallback(() => {
    console.log('Edit Profile Pressed');
    handleNavigation('EditProfile');
  }, [handleNavigation]);

  const handleChangePassword = useCallback(() => {
    console.log('Change Password Pressed');
    handleNavigation('ChangePassword');
  }, [handleNavigation]);

  const handleLanguageChange = useCallback(() => {
    console.log('Language Change Pressed');
    handleNavigation('LanguageSettings');
  }, [handleNavigation]);

  const handleNotificationSettings = useCallback(() => {
    console.log('Notification Settings Pressed');
    handleNavigation('NotificationSettings');
  }, [handleNavigation]);

  const handleCertificationUploads = useCallback(() => {
    console.log('Certification Uploads Pressed');
    handleNavigation('CertificationUploads');
  }, [handleNavigation]);

  const handleSupport = useCallback(() => {
    console.log('Support Pressed');
    handleNavigation('SupportDisputeScreen');
  }, [handleNavigation]);

  const handlePrivacyPolicy = useCallback(() => {
    console.log('Privacy Policy Pressed');
    handleNavigation('PrivacyPolicy');
  }, [handleNavigation]);

  const handleLogout = useCallback(async () => {
    console.log('Logout Pressed');
    setIsLoading(true);
    try {
      // Implement actual logout logic here (e.g., clear tokens, navigate to login screen)
      // await authService.logout();
      // navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveProfile = useCallback((profileData) => {
    console.log('Profile saved:', profileData);
    setIsLoading(true);
    // Handle profile save logic here
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSubmitIssue = useCallback((issueData) => {
    console.log('Issue submitted:', issueData);
    setIsLoading(true);
    // Handle issue submission logic here
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSubmitDispute = useCallback((disputeData) => {
    console.log('Dispute submitted:', disputeData);
    setIsLoading(true);
    // Handle dispute submission logic here
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return {
    currentTab,
    isLoading,
    handleTabChange,
    handleNavigation,
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
  };
};
