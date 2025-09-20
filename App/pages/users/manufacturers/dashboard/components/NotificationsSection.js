import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const notificationsData = [
  { id: '1', message: 'New lab-certified herbs ready for pickup.', type: 'success' },
  { id: '2', message: 'Urgent: Batch HERB-XYZ has a quality alert.', type: 'alert' },
  { id: '3', message: 'New production guidelines released.', type: 'info' },
];

const NotificationItem = ({ notification }) => {
  const icon = notification.type === 'success' ? 'check-circle' : notification.type === 'alert' ? 'warning' : 'info';
  const color = notification.type === 'success' ? '#16a34a' : notification.type === 'alert' ? '#dc2626' : '#3b82f6';

  return (
    <TouchableOpacity style={styles.notificationCard} activeOpacity={0.7}>
      <Icon name={icon} size={20} color={color} style={styles.notificationIcon} />
      <Text style={styles.notificationText}>{notification.message}</Text>
    </TouchableOpacity>
  );
};

const NotificationsSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 25,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 15,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 0, // Remove explicit border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
});

export default NotificationsSection;