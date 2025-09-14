import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const Header = ({ navigation, title = "HerbChain", showNotifications = true, onNotificationPress }) => {
  const handleNotificationPress = () => {
    // Use the onNotificationPress prop if provided (for farmer internal navigation)
    if (onNotificationPress) {
      onNotificationPress('notifications');
    } else if (navigation && navigation.navigate) {
      navigation.navigate('NotificationsScreen');
    } else {
      Alert.alert(
        'Notifications',
        'You have 3 new notifications:\n\n• New payment received\n• Training reminder\n• Weather alert for your crops',
        [{ text: 'OK' }]
      );
    }
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Navigate to profile settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Welcome back, Ramesh!</Text>
      </View>
      
      <View style={styles.rightSection}>
        {showNotifications && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#DCFCE7',
    opacity: 0.9,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 12,
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    fontSize: 20,
  },
});

export default Header;
