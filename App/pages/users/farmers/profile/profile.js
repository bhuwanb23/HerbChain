import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import BottomNavbar from '../components/bottom_navbar.js';

const ProfileScreen = ({ navigation }) => {
  const profileData = {
    name: 'Ramesh Kumar',
    email: 'ramesh@herbchain.com',
    phone: '+91 98765 43210',
    location: 'Pune, Maharashtra',
    experience: '5 years',
    totalHarvest: '125.5 kg',
    totalEarnings: '₹45,200',
    rating: '4.8',
    joinDate: 'January 2019',
  };

  const menuItems = [
    {
      id: 1,
      title: 'Edit Profile',
      icon: '✏️',
      action: 'editProfile',
    },
    {
      id: 2,
      title: 'Farm Details',
      icon: '🌾',
      action: 'farmDetails',
    },
    {
      id: 3,
      title: 'Certificates',
      icon: '📜',
      action: 'certificates',
    },
    {
      id: 4,
      title: 'Settings',
      icon: '⚙️',
      action: 'settings',
    },
    {
      id: 5,
      title: 'Help & Support',
      icon: '❓',
      action: 'help',
    },
    {
      id: 6,
      title: 'Logout',
      icon: '🚪',
      action: 'logout',
    },
  ];

  const handleMenuPress = (action) => {
    switch (action) {
      case 'editProfile':
        Alert.alert('Edit Profile', 'Navigate to edit profile screen');
        break;
      case 'farmDetails':
        Alert.alert('Farm Details', 'Navigate to farm details screen');
        break;
      case 'certificates':
        Alert.alert('Certificates', 'Navigate to certificates screen');
        break;
      case 'settings':
        Alert.alert('Settings', 'Navigate to settings screen');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Navigate to help screen');
        break;
      case 'logout':
        Alert.alert('Logout', 'Are you sure you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => navigation.navigate('Login') },
        ]);
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaWrapper style={styles.safeArea} includeBottom={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg' }}
              style={styles.profileImage}
            />
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileEmail}>{profileData.email}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingIcon}>⭐</Text>
              <Text style={styles.ratingText}>{profileData.rating}</Text>
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.experience}</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.totalHarvest}</Text>
                <Text style={styles.statLabel}>Total Harvest</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profileData.totalEarnings}</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
            </View>
          </View>

          {/* Profile Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Profile Information</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{profileData.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{profileData.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>{profileData.joinDate}</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Account Options</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaWrapper>

      <BottomNavbar navigation={navigation} activeTab="profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DCFCE7',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  menuCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    padding: 20,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});

export default ProfileScreen;
