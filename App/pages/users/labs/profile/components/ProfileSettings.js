import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

const ProfileSettings = ({ onSaveProfile }) => {
  const [profileData, setProfileData] = useState({
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@lab.com',
    phone: '+91 98765 43210',
    labName: 'Green Herbs Testing Lab',
    certification: 'AYUSH Certified Lab #12345',
    experience: '8 years',
    specialization: 'Herbal Medicine Testing',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    Alert.alert(
      'Save Profile',
      'Are you sure you want to save these changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            setIsEditing(false);
            onSaveProfile && onSaveProfile(profileData);
            Alert.alert('Success', 'Profile updated successfully!');
          }
        },
      ]
    );
  };

  const handleUploadCertification = () => {
    Alert.alert('Upload Certification', 'Certification upload feature would be implemented here.');
  };

  const profileFields = [
    {
      key: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
    },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
      keyboardType: 'email-address',
    },
    {
      key: 'phone',
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
      keyboardType: 'phone-pad',
    },
    {
      key: 'labName',
      label: 'Lab Name',
      placeholder: 'Enter lab name',
    },
    {
      key: 'certification',
      label: 'Certification',
      placeholder: 'Enter certification details',
    },
    {
      key: 'experience',
      label: 'Experience',
      placeholder: 'Enter years of experience',
    },
    {
      key: 'specialization',
      label: 'Specialization',
      placeholder: 'Enter specialization',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile & Settings</Text>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👩‍🔬</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileRole}>Lab Technician</Text>
            <Text style={styles.profileLab}>{profileData.labName}</Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : '✏️ Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {profileFields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                style={[
                  styles.textInput,
                  !isEditing && styles.textInputDisabled
                ]}
                placeholder={field.placeholder}
                value={profileData[field.key]}
                onChangeText={(value) => handleInputChange(field.key, value)}
                editable={isEditing}
                keyboardType={field.keyboardType || 'default'}
              />
            </View>
          ))}
          
          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>💾 Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Certification Upload */}
        <View style={styles.certificationSection}>
          <Text style={styles.sectionTitle}>Certification Documents</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadCertification}
          >
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadText}>Upload Certification</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🌐</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingSubtitle}>English</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔒</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Security</Text>
              <Text style={styles.settingSubtitle}>Change password, 2FA</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📱</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Settings</Text>
              <Text style={styles.settingSubtitle}>Theme, offline mode</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  scrollContainer: {
    maxHeight: 600,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  profileLab: {
    fontSize: 12,
    color: '#6B7280',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  textInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  certificationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  settingArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});

export default ProfileSettings;
