import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProfileSettingsScreen = () => {
  const navigation = useNavigation();

  const handleEditProfile = () => {
    console.log('Edit Profile Pressed');
    // navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    console.log('Change Password Pressed');
    // navigation.navigate('ChangePassword');
  };

  const handleLanguageChange = () => {
    console.log('Language Change Pressed');
    // navigation.navigate('LanguageSettings');
  };

  const handleNotificationSettings = () => {
    console.log('Notification Settings Pressed');
    // navigation.navigate('NotificationSettings');
  };

  const handleCertificationUploads = () => {
    console.log('Certification Uploads Pressed');
    // navigation.navigate('CertificationUploads');
  };

  const handleSupport = () => {
    console.log('Support Pressed');
    navigation.navigate('SupportDisputeScreen'); // Assuming this screen exists based on previous conversations
  };

  const handlePrivacyPolicy = () => {
    console.log('Privacy Policy Pressed');
    // navigation.navigate('PrivacyPolicy');
  };

  const handleLogout = () => {
    console.log('Logout Pressed');
    // Implement actual logout logic here (e.g., clear tokens, navigate to login screen)
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="person-circle-outline" size={24} color="#00BFFF" />
            <Text style={styles.headerTitle}>Profile & Settings</Text>
          </View>
          <Pressable onPress={() => console.log('Notification Bell Pressed')} style={({ pressed }) => [styles.notificationButton, pressed && styles.buttonPressed]}>
            <Ionicons name="notifications-outline" size={20} color="#808080" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.mainContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} // Placeholder image
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Dr. Arjun Singh</Text>
          <Text style={styles.profileRole}>Lab Technician - HerbChain</Text>
          <Text style={styles.profileEmail}>arjun.singh@herbchain.com</Text>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Pressable onPress={handleEditProfile} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="create-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={handleChangePassword} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={handleLanguageChange} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={handleNotificationSettings} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={handleCertificationUploads} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-upload-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Certification Uploads</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <Pressable onPress={handleSupport} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Support & Disputes</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={handlePrivacyPolicy} style={({ pressed }) => [styles.settingItem, pressed && styles.buttonPressed]}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#4B5563" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // bg-gray-50
  },
  buttonPressed: {
    opacity: 0.8,
  },
  header: {
    backgroundColor: '#FFFFFF', // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
    padding: 20, // p-5
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // space-x-3
  },
  headerTitle: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: '#111827', // text-gray-900
  },
  notificationButton: {
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16, // px-4
    paddingBottom: 24, // pb-6
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    padding: 24, // p-6
    alignItems: 'center',
    marginTop: 20, // mt-5
    marginBottom: 20, // mb-5
  },
  profileImage: {
    width: 80, // w-20
    height: 80, // h-20
    borderRadius: 40, // rounded-full
    marginBottom: 12, // mb-3
  },
  profileName: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  profileRole: {
    fontSize: 14, // text-sm
    color: '#4B5563', // text-gray-600
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },
  section: {
    marginBottom: 20, // mb-5
  },
  sectionTitle: {
    fontSize: 16, // text-base
    fontWeight: 'bold', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 12, // mb-3
    paddingLeft: 4, // px-1
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8, // rounded-lg
    paddingVertical: 14, // py-3.5
    paddingHorizontal: 16, // px-4
    marginBottom: 8, // mb-2
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // space-x-3
  },
  settingText: {
    fontSize: 16,
    color: '#111827', // text-gray-900
  },
  logoutSection: {
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // space-x-3
    backgroundColor: '#FEE2E2', // bg-red-100
    borderRadius: 8, // rounded-lg
    paddingVertical: 14, // py-3.5
    paddingHorizontal: 16, // px-4
    borderWidth: 1,
    borderColor: '#FCA5A5', // border-red-300
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500', // font-medium
    color: '#EF4444', // text-red-500
  },
});

export default ProfileSettingsScreen;