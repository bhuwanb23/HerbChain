import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import {
  WelcomeBanner,
  QuickActions,
  MapWidget,
  NotificationsPanel,
  TripCards,
} from './components';
import { useTransporterDashboard } from './hooks';

const TransporterDashboard = () => {
  const insets = useSafeAreaInsets();
  const { handleQuickAction, handleTripPress } = useTransporterDashboard();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <WelcomeBanner />
        <QuickActions onActionPress={handleQuickAction} />
        <MapWidget />
        <NotificationsPanel />
        <TripCards onTripPress={handleTripPress} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
});

export default TransporterDashboard;