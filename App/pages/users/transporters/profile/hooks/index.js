import { useState, useCallback } from 'react';
import { MOCK_PROFILE, VEHICLE_INFO, SETTINGS_DEFAULTS, DOCUMENTS } from '../constants';

export const useProfile = () => {
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [vehicle, setVehicle] = useState(VEHICLE_INFO);
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [documents, setDocuments] = useState(DOCUMENTS);

  const toggleDarkMode = useCallback(() => {
    setSettings((s) => ({ ...s, darkMode: !s.darkMode }));
  }, []);

  const onUploadDocument = useCallback((docId) => {
    setDocuments((docs) =>
      docs.map((d) => (d.id === docId ? { ...d, status: 'verified' } : d))
    );
  }, []);

  return {
    profile,
    vehicle,
    settings,
    documents,
    setProfile,
    setVehicle,
    setSettings,
    toggleDarkMode,
    onUploadDocument,
  };
};


