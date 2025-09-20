import { useState } from 'react';
import { MANUFACTURER_PROFILE_DATA, STAFF_DATA, TRANSACTION_HISTORY, LANGUAGE_OPTIONS, SUPPORT_LINKS } from '../constants/profileConstants';

const useProfileData = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [profileData, setProfileData] = useState(MANUFACTURER_PROFILE_DATA);
  const [staffData, setStaffData] = useState(STAFF_DATA);
  const [transactionHistory, setTransactionHistory] = useState(TRANSACTION_HISTORY);
  const [languageOptions, setLanguageOptions] = useState(LANGUAGE_OPTIONS);
  const [supportLinks, setSupportLinks] = useState(SUPPORT_LINKS);
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(true);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(false);

  const handleProfileUpdate = (updatedData) => {
    setProfileData(prevData => ({ ...prevData, ...updatedData }));
    // In a real app, this would involve an API call to save the data
  };

  const addStaff = (newStaff) => {
    setStaffData(prevStaff => [...prevStaff, { ...newStaff, id: String(prevStaff.length + 1) }]);
    // API call to add staff
  };

  const removeStaff = (staffId) => {
    setStaffData(prevStaff => prevStaff.filter(staff => staff.id !== staffId));
    // API call to remove staff
  };

  const toggleBiometricLogin = () => {
    setBiometricLoginEnabled(prevState => !prevState);
    // API call to update setting
  };

  const toggleTwoFactorAuth = () => {
    setTwoFactorAuthEnabled(prevState => !prevState);
    // API call to update setting
  };

  return {
    activeTab,
    setActiveTab,
    profileData,
    handleProfileUpdate,
    staffData,
    addStaff,
    removeStaff,
    transactionHistory,
    languageOptions,
    supportLinks,
    biometricLoginEnabled,
    toggleBiometricLogin,
    twoFactorAuthEnabled,
    toggleTwoFactorAuth,
  };
};

export default useProfileData;