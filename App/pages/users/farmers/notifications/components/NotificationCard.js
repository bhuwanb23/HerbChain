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
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
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
    padding: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinButton: {
    padding: 4,
    marginBottom: 8,
  },
  pinIcon: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  pinnedIcon: {
    color: '#F59E0B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
});

export default NotificationCard;
