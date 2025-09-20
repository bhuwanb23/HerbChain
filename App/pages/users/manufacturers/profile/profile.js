import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabNavigation from './components/ProfileTabNavigation';
import BusinessInfoTab from './components/BusinessInfoTab';
import AuthorizedStaffTab from './components/AuthorizedStaffTab';
import PaymentsBillingTab from './components/PaymentsBillingTab';
import LanguageSecurityTab from './components/LanguageSecurityTab';
import HelpSupportTab from './components/HelpSupportTab';
import useProfileData from './hooks/useProfileData';

const ProfilePage = () => {
  const {
    activeTab,
    setActiveTab,
    profileData,
    handleProfileUpdate,
    staffData,
    removeStaff,
    transactionHistory,
    languageOptions,
    biometricLoginEnabled,
    toggleBiometricLogin,
    twoFactorAuthEnabled,
    toggleTwoFactorAuth,
    supportLinks,
  } = useProfileData();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessInfoTab profileData={profileData} onUpdateProfile={handleProfileUpdate} />;
      case 'staff':
        return <AuthorizedStaffTab staffData={staffData} onRemoveStaff={removeStaff} />;
      case 'billing':
        return <PaymentsBillingTab transactionHistory={transactionHistory} />;
      case 'security':
        return (
          <LanguageSecurityTab
            languageOptions={languageOptions}
            selectedLanguage={profileData.language || 'en'} // Assuming language is part of profileData
            onSelectLanguage={(lang) => handleProfileUpdate({ language: lang })}
            biometricLoginEnabled={biometricLoginEnabled}
            toggleBiometricLogin={toggleBiometricLogin}
            twoFactorAuthEnabled={twoFactorAuthEnabled}
            toggleTwoFactorAuth={toggleTwoFactorAuth}
          />
        );
      case 'support':
        return <HelpSupportTab supportLinks={supportLinks} />;
      default:
        return <BusinessInfoTab profileData={profileData} onUpdateProfile={handleProfileUpdate} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ProfileHeader />
      <ProfileTabNavigation activeTab={activeTab} onSelectTab={setActiveTab} />
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
  },
  contentScroll: {
    flex: 1,
  },
});

export default ProfilePage;