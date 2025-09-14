import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationCard from './NotificationCard';

const NotificationSection = ({ title, notifications, onPin, onPress }) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.notificationsList}>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onPin={onPin}
            onPress={onPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginHorizontal: 12,
    marginBottom: 8,
  },
  notificationsList: {
    gap: 0,
  },
});

export default NotificationSection;
