import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';
import { VEHICLE_INFO, SETTINGS_DEFAULTS, DOCUMENTS } from '../constants';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(VEHICLE_INFO);
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [documents, setDocuments] = useState(DOCUMENTS);
  const [isLoading, setIsLoading] = useState(true);

  // Default transporter user ID for development
  const TRANSPORTER_USER_ID = 'transporter_001';

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${TRANSPORTER_USER_ID}`);
      
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
        // Add transporter-specific fields
        licenseNumber: 'TR-2024-001',
        experience: '5 years',
        rating: 4.8,
        totalDeliveries: 150
      };
      
      setProfile(transformedData);
    } catch (error) {
      console.error('Error fetching transporter profile:', error);
      // Fallback to default data if API fails
      setProfile({
        user_id: TRANSPORTER_USER_ID,
        name: 'Amit Singh',
        email: 'amit@example.com',
        phone: '+91-9876543211',
        location: 'Mumbai, Maharashtra',
        role: 'transporter',
        kyc_verified: true,
        language_pref: 'en',
        licenseNumber: 'TR-2024-001',
        experience: '5 years',
        rating: 4.8,
        totalDeliveries: 150
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (newData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${TRANSPORTER_USER_ID}`, {
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
      setProfile(prev => ({
        ...prev,
        ...updatedUser.user,
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating transporter profile:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings((s) => ({ ...s, darkMode: !s.darkMode }));
  }, []);

  const onUploadDocument = useCallback((docId) => {
    setDocuments((docs) =>
      docs.map((d) => (d.id === docId ? { ...d, status: 'verified' } : d))
    );
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    vehicle,
    settings,
    documents,
    isLoading,
    setProfile,
    setVehicle,
    setSettings,
    updateProfile,
    toggleDarkMode,
    onUploadDocument,
    refreshProfile: fetchProfile,
  };
};


