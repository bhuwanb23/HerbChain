import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const NotificationCard = ({ notification, onPin, onPress }) => {
  const getIconBackgroundColor = (type) => {
    switch (type) {
      case 'payment':
        return '#DCFCE7'; // green-100
      case 'lab':
        return '#DBEAFE'; // blue-100
      case 'logistics':
        return '#FED7AA'; // orange-100
      case 'policy':
        return '#F3E8FF'; // purple-100
      default:
        return '#F3F4F6'; // gray-100
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'payment':
        return '💰';
      case 'lab':
        return '🧪';
      case 'logistics':
        return '🚚';
      case 'policy':
        return '📢';
      default:
        return '📋';
    }
  };

  const handlePress = () => {
    Alert.alert('Notification', notification.message);
    onPress(notification.id);
  };

  const handlePin = () => {
    Alert.alert('Pin Notification', 'Notification pinned successfully');
    onPin(notification.id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        notification.isRead && styles.readContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getIconBackgroundColor(notification.type) },
            ]}
          >
            <Text style={styles.icon}>{getIcon(notification.type)}</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
            <Text style={styles.timestamp}>{notification.timestamp}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.pinButton}
            onPress={handlePin}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.pinIcon,
              notification.isPinned && styles.pinnedIcon
            ]}>
              📌
            </Text>
          </TouchableOpacity>
          
          {!notification.isRead && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  readContainer: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinButton: {
    padding: 3,
    marginBottom: 6,
  },
  pinIcon: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pinnedIcon: {
    color: '#F59E0B',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
});

export default NotificationCard;
