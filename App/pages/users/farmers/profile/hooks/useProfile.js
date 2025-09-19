import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';

export const useProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default farmer user ID for development
  const FARMER_USER_ID = 'farmer_001';

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${FARMER_USER_ID}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const userData = await response.json();
      
      // Transform API data to match profile format
      const transformedData = {
        user_id: userData.user_id,
        name: userData.name,
        title: 'Organic Farm Owner',
        email: userData.email,
        phone: userData.phone,
        location: userData.location,
        imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
        bankAccount: '****-****-****-1234',
        role: userData.role,
        kyc_verified: userData.kyc_verified,
        language_pref: userData.language_pref,
        created_at: userData.created_at
      };
      
      setProfileData(transformedData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to default data if API fails
      setProfileData({
        user_id: FARMER_USER_ID,
        name: 'Rajesh Kumar',
        title: 'Organic Farm Owner',
        email: 'rajesh@example.com',
        phone: '+91-9876543210',
        location: 'Pune, Maharashtra',
        imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
        bankAccount: '****-****-****-1234',
        role: 'farmer',
        kyc_verified: true,
        language_pref: 'en'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (newData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${FARMER_USER_ID}`, {
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
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profileData,
    isLoading,
    updateProfile,
    resetProfile,
    refreshProfile: fetchProfile,
  };
};
