import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';

const ProfileForm = ({ profileData, onUpdateProfile }) => {
  const [formData, setFormData] = useState({
    fullName: profileData.name,
    phoneNumber: profileData.phone,
    farmAddress: profileData.location,
    bankAccount: '****-****-****-1234',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onUpdateProfile(formData);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(value) => handleInputChange('fullName', value)}
            placeholder="Enter full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Farm Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.farmAddress}
            onChangeText={(value) => handleInputChange('farmAddress', value)}
            placeholder="Enter farm address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bank Account</Text>
          <TextInput
            style={styles.input}
            value={formData.bankAccount}
            onChangeText={(value) => handleInputChange('bankAccount', value)}
            placeholder="Enter bank account"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default ProfileForm;
