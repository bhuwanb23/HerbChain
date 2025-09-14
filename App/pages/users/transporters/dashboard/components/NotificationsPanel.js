import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationsPanel = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Route Delay Alert',
      message: 'Traffic on Route A-102, +15 min delay expected',
      time: '2 min ago',
      type: 'warning',
      icon: 'warning',
      color: '#F59E0B',
    },
    {
      id: 2,
      title: 'Handover Ready',
      message: 'Package #TR-8847 ready for customer pickup',
      time: '5 min ago',
      type: 'info',
      icon: 'info',
      color: '#3B82F6',
    },
    {
      id: 3,
      title: 'Fuel Low Warning',
      message: 'Consider refueling at next stop',
      time: '10 min ago',
      type: 'warning',
      icon: 'local-gas-station',
      color: '#EF4444',
    },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check-circle';
      default:
        return 'notifications';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon name="notifications" size={20} color="#F59E0B" />
            <Text style={styles.title}>Alerts</Text>
          </View>
          <View style={styles.badgeContainer}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>3</Text>
            </LinearGradient>
          </View>
        </View>

        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.map((notification, index) => (
            <Animated.View
              key={notification.id}
              style={[
                styles.notificationItem,
                index < notifications.length - 1 && styles.notificationBorder,
              ]}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Icon
                      name={getNotificationIcon(notification.type)}
                      size={16}
                      color={notification.color}
                    />
                  </View>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  badgeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationsList: {
    maxHeight: 200,
  },
  notificationItem: {
    padding: 16,
  },
  notificationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default NotificationsPanel;