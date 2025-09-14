import { useState, useCallback } from 'react';
import { PROFILE_DATA } from '../constants';

export const useProfile = () => {
  const [profileData, setProfileData] = useState(PROFILE_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = useCallback(async (newData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfileData(prev => ({
        ...prev,
        ...newData,
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
    setProfileData(PROFILE_DATA);
  }, []);

  return {
    profileData,
    isLoading,
    updateProfile,
    resetProfile,
  };
};
