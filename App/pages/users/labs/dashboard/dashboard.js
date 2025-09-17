import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useDashboard } from './hooks';
import {
  StatsGrid,
  QuickActions,
  NotificationsPanel,
  RecentActivity,
  NotificationsModal,
} from './components';

const DashboardScreen = () => {
  const {
    isNotificationsModalVisible,
    toggleNotificationsModal,
    handleNavigation,
    handleNotificationPress,
  } = useDashboard();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent}>
        <StatsGrid />
        
        <QuickActions onActionPress={handleNavigation} />
        
        <NotificationsPanel 
          onViewAllPress={toggleNotificationsModal}
          onNotificationPress={handleNavigation}
        />
        
        <RecentActivity />
      </ScrollView>

      <NotificationsModal
        visible={isNotificationsModalVisible}
        onClose={toggleNotificationsModal}
        onNotificationPress={handleNavigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default DashboardScreen;