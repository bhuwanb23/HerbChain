import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useProfile } from './hooks';
import {
  ProfileInfo,
  VehicleDetails,
  SettingsSection,
  DocumentsSection,
  AccountActions,
} from './components';

const TransporterProfileScreen = ({ navigation }) => {
  const {
    profile,
    vehicle,
    settings,
    documents,
    toggleDarkMode,
    onUploadDocument,
  } = useProfile();

  const handleLogout = () => {
    if (navigation && navigation.reset) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileInfo
          name={profile.name}
          phone={profile.phone}
          avatar={profile.avatar}
          vehicleName={profile.vehicleName}
          onChangePhoto={() => Alert.alert('Change Photo', 'Photo picker coming soon')}
        />

        <VehicleDetails vehicle={vehicle} onEdit={() => Alert.alert('Edit Vehicle', 'Vehicle edit coming soon')} />

        <SettingsSection
          language={settings.language}
          darkMode={settings.darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <DocumentsSection documents={documents} onUploadDocument={onUploadDocument} />

        <AccountActions onLogout={handleLogout} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
});

export default TransporterProfileScreen;


