import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';

const AppSettings = () => {
  const [settings, setSettings] = useState({
    language: 'English',
    offlineSync: true,
    pushNotifications: true,
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Language',
      'Select language',
      [
        { text: 'English', onPress: () => setSettings(prev => ({ ...prev, language: 'English' })) },
        { text: 'Spanish', onPress: () => setSettings(prev => ({ ...prev, language: 'Spanish' })) },
        { text: 'French', onPress: () => setSettings(prev => ({ ...prev, language: 'French' })) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Navigate to change password screen');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Navigate to privacy settings screen');
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>App Settings</Text>
      
      <View style={styles.settingsList}>
        <SettingItem
          icon="🌍"
          title="Language"
          onPress={handleLanguageChange}
          rightComponent={
            <Text style={styles.settingValue}>{settings.language}</Text>
          }
        />

        <SettingItem
          icon="☁️"
          title="Offline Sync"
          subtitle="Auto-sync when online"
          rightComponent={
            <Switch
              value={settings.offlineSync}
              onValueChange={() => handleToggle('offlineSync')}
              trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
              thumbColor={settings.offlineSync ? 'white' : '#F3F4F6'}
            />
          }
        />

        <SettingItem
          icon="🔔"
          title="Push Notifications"
          subtitle="Weather alerts & reminders"
          rightComponent={
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => handleToggle('pushNotifications')}
              trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
              thumbColor={settings.pushNotifications ? 'white' : '#F3F4F6'}
            />
          }
        />

        <SettingItem
          icon="🔒"
          title="Change Password"
          onPress={handleChangePassword}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />

        <SettingItem
          icon="🛡️"
          title="Privacy Settings"
          onPress={handlePrivacySettings}
          rightComponent={<Text style={styles.arrow}>›</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingsList: {
    gap: 12,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#22c55e',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});

export default AppSettings;
