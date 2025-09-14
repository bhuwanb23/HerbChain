import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNotifications } from './hooks';
import {
  NotificationHeader,
  FilterTabs,
  NotificationSection,
} from './components';

const NotificationsScreen = ({ navigation }) => {
  const {
    groupedNotifications,
    activeFilter,
    unreadCount,
    markAsRead,
    markAllAsRead,
    togglePin,
    changeFilter,
  } = useNotifications();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    Alert.alert('Success', 'All notifications marked as read');
  };

  const handleOpenSettings = () => {
    Alert.alert('Settings', 'Notification settings will be implemented');
  };

  const handleNotificationPress = (notificationId) => {
    markAsRead(notificationId);
  };

  const handlePinNotification = (notificationId) => {
    togglePin(notificationId);
  };

  return (
    <View style={styles.container}>
      <NotificationHeader
        onBack={handleBack}
        onMarkAllRead={handleMarkAllRead}
        onOpenSettings={handleOpenSettings}
      />
      
      <FilterTabs
        activeFilter={activeFilter}
        onFilterChange={changeFilter}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <NotificationSection
          title="Pinned"
          notifications={groupedNotifications.pinned}
          onPin={handlePinNotification}
          onPress={handleNotificationPress}
        />
        
        <NotificationSection
          title="Recent"
          notifications={groupedNotifications.recent}
          onPin={handlePinNotification}
          onPress={handleNotificationPress}
        />
        
        <NotificationSection
          title="Earlier"
          notifications={groupedNotifications.earlier}
          onPin={handlePinNotification}
          onPress={handleNotificationPress}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
});

export default NotificationsScreen;
