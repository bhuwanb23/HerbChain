import React from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
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
    loading,
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 80, // Add padding to prevent content from going behind navbar
  },
});

export default NotificationsScreen;
