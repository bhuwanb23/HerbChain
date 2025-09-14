import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const Notifications = ({ notifications = [], onNotificationPress }) => {
  const defaultNotifications = [
    {
      id: 'NOTIF-001',
      type: 'system_alert',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Jan 20, 2024 from 2:00 AM to 4:00 AM',
      timestamp: '2024-01-15 10:30',
      isRead: false,
    },
    {
      id: 'NOTIF-002',
      type: 'compliance_failed',
      title: 'Compliance Alert',
      message: 'Batch BATCH-003 failed AYUSH standards - Pesticide residue detected',
      timestamp: '2024-01-15 09:15',
      isRead: false,
    },
    {
      id: 'NOTIF-003',
      type: 'retest_request',
      title: 'Retest Request',
      message: 'Farmer Priya Sharma requested retest for Batch BATCH-002',
      timestamp: '2024-01-15 08:45',
      isRead: true,
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : defaultNotifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system_alert': return '⚠️';
      case 'compliance_failed': return '❌';
      case 'retest_request': return '🔄';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'system_alert': return '#F59E0B';
      case 'compliance_failed': return '#EF4444';
      case 'retest_request': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => onNotificationPress && onNotificationPress('all')} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.isRead && styles.unreadCard
            ]}
            onPress={() => onNotificationPress && onNotificationPress(notification.id)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTimestamp}>{notification.timestamp}</Text>
              </View>
              {!notification.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(notification.type) }]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});

export default Notifications;
