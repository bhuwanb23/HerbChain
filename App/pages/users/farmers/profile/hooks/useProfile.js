import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { AuthAPI } from '../../../../../services/apiClient';

// Server user (GET/PATCH /api/v1/auth/me) -> profile screen shape
const transformUser = (u) => ({
  user_id: u.id,
  name: u.name,
  title: 'Organic Farm Owner',
  email: u.email,
  phone: u.phone,
  location: u.location ?? null,
  imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
  bankAccount: '****-****-****-1234',
  role: u.role,
  kyc_verified: u.kyc_status === 'verified',
  language_pref: 'en',
  created_at: u.created_at,
});

const FALLBACK_PROFILE = {
  user_id: 'farmer_001',
  name: 'Rajesh Kumar',
  title: 'Organic Farm Owner',
  email: 'rajesh@example.com',
  phone: '+91-9876543210',
  location: 'Pune, Maharashtra',
  imageUrl: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
  bankAccount: '****-****-****-1234',
  role: 'farmer',
  kyc_verified: true,
  language_pref: 'en',
};

export const useProfile = () => {
  const { accessToken } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { user } = await AuthAPI.me(accessToken);
      setProfileData(transformUser(user));
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to default data if API fails
      setProfileData(FALLBACK_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const updateProfile = useCallback(async (newData) => {
    setIsLoading(true);
    try {
      const { user } = await AuthAPI.updateMe(accessToken, newData);

      // Update local state
      setProfileData(prev => ({
        ...prev,
        ...transformUser(user),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

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
