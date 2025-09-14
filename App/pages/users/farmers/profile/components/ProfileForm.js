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
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  formSection: {
    gap: 12,
  },
  inputGroup: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    color: '#1F2937',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
});

export default ProfileForm;
