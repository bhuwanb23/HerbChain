import { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../../contexts/AuthContext';
import { AuthAPI } from '../../../../../services/apiClient';

// Server user (GET/PATCH /api/v1/auth/me) -> profile screen shape
const transformUser = (u) => ({
  user_id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  location: u.location ?? null,
  role: u.role,
  kyc_verified: u.kyc_status === 'verified',
  language_pref: 'en',
  created_at: u.created_at,
  // Add lab-specific fields
  labName: 'AYUSH Certified Lab',
  certification: 'ISO 17025',
  specialization: 'Herbal Medicine Testing',
  accreditation: 'NABL Accredited',
});

const FALLBACK_PROFILE = {
  user_id: 'lab_001',
  name: 'Dr. Priya Sharma',
  email: 'priya@example.com',
  phone: '+91-9876543212',
  location: 'Delhi, India',
  role: 'lab',
  kyc_verified: true,
  language_pref: 'en',
  labName: 'AYUSH Certified Lab',
  certification: 'ISO 17025',
  specialization: 'Herbal Medicine Testing',
  accreditation: 'NABL Accredited',
};

export const useProfile = () => {
  const navigation = useNavigation();
  const { accessToken } = useAuth();
  const [currentTab, setCurrentTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { user } = await AuthAPI.me(accessToken);
      setProfileData(transformUser(user));
    } catch (error) {
      console.error('Error fetching lab profile:', error);
      // Fallback to default data if API fails
      setProfileData(FALLBACK_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const updateProfile = useCallback(async (newData) => {
    try {
      const { user } = await AuthAPI.updateMe(accessToken, newData);

      // Update local state
      setProfileData(prev => ({
        ...prev,
        ...transformUser(user),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating lab profile:', error);
      return { success: false, error: error.message };
    }
  }, [accessToken]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleTabChange = useCallback((tabId) => {
    setCurrentTab(tabId);
  }, []);

  const handleEditProfile = useCallback(() => {
    console.log('Edit Profile Pressed');
    // navigation.navigate('EditProfile');
  }, []);

  const handleChangePassword = useCallback(() => {
    console.log('Change Password Pressed');
    // navigation.navigate('ChangePassword');
  }, []);

  const handleLanguageChange = useCallback(() => {
    console.log('Language Change Pressed');
    // navigation.navigate('LanguageSettings');
  }, []);

  const handleNotificationSettings = useCallback(() => {
    console.log('Notification Settings Pressed');
    // navigation.navigate('NotificationSettings');
  }, []);

  const handleCertificationUploads = useCallback(() => {
    console.log('Certification Uploads Pressed');
    // navigation.navigate('CertificationUploads');
  }, []);

  const handleSupport = useCallback(() => {
    console.log('Support Pressed');
    setCurrentTab('support');
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    console.log('Privacy Policy Pressed');
    // navigation.navigate('PrivacyPolicy');
  }, []);

  const handleLogout = useCallback(() => {
    console.log('Logout Pressed');
    // Implement actual logout logic here (e.g., clear tokens, navigate to login screen)
  }, []);

  const handleSaveProfile = useCallback((profileData) => {
    console.log('Profile saved:', profileData);
    // Handle profile save
  }, []);

  const handleSubmitIssue = useCallback((issueData) => {
    console.log('Issue submitted:', issueData);
    // Handle issue submission
  }, []);

  const handleSubmitDispute = useCallback((disputeData) => {
    console.log('Dispute submitted:', disputeData);
    // Handle dispute submission
  }, []);

  return {
    currentTab,
    profileData,
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
    updateProfile,
    refreshProfile: fetchProfile,
  };
};
