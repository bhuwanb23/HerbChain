import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'; // Using FontAwesome5 for better icon match

const DashboardHeader = ({ navigation, manufacturerName, avatarUrl, notificationsCount }) => {
  const handleNotificationPress = () => {
    // Navigate to notifications page or show a modal
    if (navigation && navigation.navigate) {
      navigation.navigate('NotificationsScreen'); // Assuming a NotificationsScreen exists
    } else {
      console.log('Notifications pressed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.logoWrapper}>
          <Icon name="seedling" size={16} color="white" />
        </View>
        <Text style={styles.title}>AyurDash</Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Icon name="bell" size={18} color="#4b5563" />
          {notificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{notificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 50, // Ensure header is on top
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 32,
    height: 32,
    backgroundColor: '#7C9885',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 15,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default DashboardHeader;