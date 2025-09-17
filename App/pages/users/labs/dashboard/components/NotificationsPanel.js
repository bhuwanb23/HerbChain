import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NOTIFICATIONS_DATA, COLORS } from '../constants';

const NotificationCard = ({ notification, onNotificationPress }) => {
  return (
    <View style={[styles.notificationCard, styles.cardBorder]}>
      <View style={styles.notificationContent}>
        <Ionicons 
          name={notification.icon} 
          size={24} 
          color={notification.iconColor} 
          style={styles.notificationIcon} 
        />
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationSubtitle}>{notification.subtitle}</Text>
          <View style={styles.notificationActions}>
            <Text style={styles.notificationTime}>{notification.time}</Text>
            <TouchableOpacity onPress={() => onNotificationPress(notification.navigateTo)}>
              <Text style={styles.viewDetailsText}>{notification.actionText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const NotificationsPanel = ({ onViewAllPress, onNotificationPress }) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>Recent Notifications</Text>
        <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.notificationList}>
        {NOTIFICATIONS_DATA.map((notification) => (
          <NotificationCard 
            key={notification.id} 
            notification={notification} 
            onNotificationPress={onNotificationPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  notificationList: {
    // spacing managed by marginBottom on notificationCard
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#808080',
  },
  viewDetailsText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  cardBorder: {
    borderColor: '#E5E7EB',
  },
});

export default NotificationsPanel;
