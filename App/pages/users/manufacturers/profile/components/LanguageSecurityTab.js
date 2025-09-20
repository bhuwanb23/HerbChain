import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const LanguageSecurityTab = ({
  languageOptions,
  selectedLanguage,
  onSelectLanguage,
  biometricLoginEnabled,
  toggleBiometricLogin,
  twoFactorAuthEnabled,
  toggleTwoFactorAuth,
}) => {
  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Functionality to change password will be implemented here.');
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>Language & Security</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Language</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => onSelectLanguage(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {languageOptions.map((lang) => (
              <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Biometric Login</Text>
            <Text style={styles.settingSubtitle}>Use fingerprint or face ID</Text>
          </View>
          <Switch
            trackColor={{ false: '#e5e7eb', true: '#059669' }}
            thumbColor={biometricLoginEnabled ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#e5e7eb"
            onValueChange={toggleBiometricLogin}
            value={biometricLoginEnabled}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
            <Text style={styles.settingSubtitle}>Add extra security layer</Text>
          </View>
          <Switch
            trackColor={{ false: '#e5e7eb', true: '#059669' }}
            thumbColor={twoFactorAuthEnabled ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#e5e7eb"
            onValueChange={toggleTwoFactorAuth}
            value={twoFactorAuthEnabled}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
        <Text style={styles.changePasswordButtonText}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    width: '100%',
    color: '#111827',
  },
  pickerItem: {
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  changePasswordButton: {
    backgroundColor: '#ef4444', // red-500
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LanguageSecurityTab;