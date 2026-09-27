import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { AuthAPI } from '../../../../../services/apiClient';
import { VEHICLE_INFO, SETTINGS_DEFAULTS, DOCUMENTS } from '../constants';

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
  // Add transporter-specific fields
  licenseNumber: 'TR-2024-001',
  experience: '5 years',
  rating: 4.8,
  totalDeliveries: 150,
});

const FALLBACK_PROFILE = {
  user_id: 'transporter_001',
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
  totalDeliveries: 150,
};

export const useProfile = () => {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(VEHICLE_INFO);
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [documents, setDocuments] = useState(DOCUMENTS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { user } = await AuthAPI.me(accessToken);
      setProfile(transformUser(user));
    } catch (error) {
      console.error('Error fetching transporter profile:', error);
      // Fallback to default data if API fails
      setProfile(FALLBACK_PROFILE);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const updateProfile = useCallback(async (newData) => {
    try {
      const { user } = await AuthAPI.updateMe(accessToken, newData);

      // Update local state
      setProfile(prev => ({
        ...prev,
        ...transformUser(user),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating transporter profile:', error);
      return { success: false, error: error.message };
    }
  }, [accessToken]);

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
