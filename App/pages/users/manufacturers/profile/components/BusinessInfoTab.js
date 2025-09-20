import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BusinessInfoTab = ({ profileData, onUpdateProfile }) => {
  const [companyName, setCompanyName] = useState(profileData.companyName);
  const [licenseNumber, setLicenseNumber] = useState(profileData.licenseNumber);
  const [contactNumber, setContactNumber] = useState(profileData.contactNumber);
  const [emailAddress, setEmailAddress] = useState(profileData.emailAddress);
  const [businessAddress, setBusinessAddress] = useState(profileData.businessAddress);

  useEffect(() => {
    setCompanyName(profileData.companyName);
    setLicenseNumber(profileData.licenseNumber);
    setContactNumber(profileData.contactNumber);
    setEmailAddress(profileData.emailAddress);
    setBusinessAddress(profileData.businessAddress);
  }, [profileData]);

  const handleSaveChanges = () => {
    onUpdateProfile({
      companyName,
      licenseNumber,
      contactNumber,
      emailAddress,
      businessAddress,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.cardContainer}>
        <View style={styles.companyHeader}>
          <View style={styles.companyIconWrapper}>
            <Icon name="business" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.companyName}>{profileData.companyName}</Text>
            <Text style={styles.licenseText}>License: {profileData.licenseNumber}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>AYUSH License Number</Text>
          <TextInput
            style={styles.input}
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="Enter license number"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            placeholder="Enter contact number"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            placeholder="Enter email address"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={businessAddress}
            onChangeText={setBusinessAddress}
            multiline
            numberOfLines={3}
            placeholder="Enter business address"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
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
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyIconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#059669', // primary
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  licenseText: {
    fontSize: 14,
    color: '#6b7280',
  },
  formSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#059669', // primary
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BusinessInfoTab;