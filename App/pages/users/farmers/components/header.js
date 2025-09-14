import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Header = ({ navigation, title = "HerbChain", showNotifications = true, onNotificationPress }) => {
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container]}>
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
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
                <Icon name="notifications" size={20} color="white" />
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
              <Icon name="person" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    paddingTop:5,
  },
  gradient: {
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 2,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#DCFCE7',
    opacity: 0.95,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  profileButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Header;
