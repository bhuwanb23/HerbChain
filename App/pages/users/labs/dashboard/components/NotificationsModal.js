import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
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

const NotificationsModal = ({ visible, onClose, onNotificationPress }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>
          <ScrollView>
            <View style={styles.notificationList}>
              {NOTIFICATIONS_DATA.map((notification) => (
                <NotificationCard 
                  key={notification.id} 
                  notification={notification} 
                  onNotificationPress={onNotificationPress}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 107, 56, 0.6)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
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

export default NotificationsModal;
