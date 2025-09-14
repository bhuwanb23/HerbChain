import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransporterDashboard } from './hooks/useTransporterDashboard';
import {
  TRANSPORTER_INFO,
  STATUS_CARDS,
  SAMPLE_NOTIFICATIONS,
  MAP_WIDGET_DATA,
  QUICK_ACTIONS,
} from './constants';
import {
  WelcomeBanner,
  StatusCards,
  MapWidget,
  NotificationsPanel,
  QuickActions,
} from './components';

const TransporterDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    isMapExpanded,
    handleCardPress,
    handleNotificationPress,
    handleQuickAction,
    toggleMapExpanded,
  } = useTransporterDashboard();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <WelcomeBanner transporterInfo={TRANSPORTER_INFO} />
        
        <StatusCards 
          statusCards={STATUS_CARDS}
          onCardPress={handleCardPress}
        />
        
        <MapWidget 
          mapData={MAP_WIDGET_DATA}
          isExpanded={isMapExpanded}
          onToggleExpanded={toggleMapExpanded}
        />
        
        <QuickActions 
          quickActions={QUICK_ACTIONS}
          onActionPress={handleQuickAction}
        />
        
        <NotificationsPanel 
          notifications={SAMPLE_NOTIFICATIONS}
          onNotificationPress={handleNotificationPress}
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
    paddingTop: 0, // Remove top padding to eliminate white space
  },
});

export default TransporterDashboard;
