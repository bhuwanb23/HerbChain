import { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../../../../constants/api';

export const useProfile = () => {
  const navigation = useNavigation();
  const [currentTab, setCurrentTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default lab user ID for development
  const LAB_USER_ID = 'lab_001';

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${LAB_USER_ID}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const userData = await response.json();
      
      // Transform API data to match profile format
      const transformedData = {
        user_id: userData.user_id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        role: userData.role,
        kyc_verified: userData.kyc_verified,
        language_pref: userData.language_pref,
        created_at: userData.created_at,
        // Add lab-specific fields
        labName: 'AYUSH Certified Lab',
        certification: 'ISO 17025',
        specialization: 'Herbal Medicine Testing',
        accreditation: 'NABL Accredited'
      };
      
      setProfileData(transformedData);
    } catch (error) {
      console.error('Error fetching lab profile:', error);
      // Fallback to default data if API fails
      setProfileData({
        user_id: LAB_USER_ID,
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
        accreditation: 'NABL Accredited'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (newData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${LAB_USER_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedUser = await response.json();
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        ...updatedUser.user,
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating lab profile:', error);
      return { success: false, error: error.message };
    }
  }, []);

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
