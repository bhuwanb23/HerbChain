import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationsPanel = ({ notifications, onNotificationPress, onMarkAsRead }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22c55e';
      default: return '#6B7280';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'delay': return 'warning';
      case 'handover': return 'check-circle';
      case 'incentive': return 'monetization-on';
      case 'route_update': return 'route';
      case 'emergency': return 'emergency';
      default: return 'notifications';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Icon name="notifications" size={18} color="#374151" />
          <Text style={styles.title}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="arrow-forward" size={14} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotification
            ]}
            onPress={() => onNotificationPress(notification)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: `${getPriorityColor(notification.priority)}20` }
                ]}>
                  <Icon 
                    name={getNotificationIcon(notification.type)} 
                    size={16} 
                    color={getPriorityColor(notification.priority)} 
                  />
                </View>
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
                <View style={styles.notificationMeta}>
                  {!notification.isRead && <View style={styles.unreadDot} />}
                  <Text style={styles.timestamp}>{notification.timestamp}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 2,
  },
  notificationsList: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  notificationMeta: {
    alignItems: 'flex-end',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 9,
    color: '#9CA3AF',
  },
});

export default NotificationsPanel;
