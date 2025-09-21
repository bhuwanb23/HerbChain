import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import {
  GreetingSection,
  StatsCards,
  ActionButtons,
  ActivityFeed,
} from './components';

const Dashboard = ({ navigation }) => {
  const { t } = useGlobalTranslation();
  
  const handleActionPress = (actionId) => {
    switch (actionId) {
      case 'herb-batches':
        Alert.alert(t.farmerDashboard.navigationAlerts.navigation, t.farmerDashboard.navigationAlerts.herbBatches);
        break;
      case 'sales-revenue':
        Alert.alert(t.farmerDashboard.navigationAlerts.navigation, t.farmerDashboard.navigationAlerts.salesRevenue);
        break;
      case 'harvest-schedule':
        Alert.alert(t.farmerDashboard.navigationAlerts.navigation, t.farmerDashboard.navigationAlerts.harvestSchedule);
        break;
      case 'training-tips':
        Alert.alert(t.farmerDashboard.navigationAlerts.navigation, t.farmerDashboard.navigationAlerts.trainingTips);
        break;
      default:
        Alert.alert(t.farmerDashboard.navigationAlerts.navigation, `Navigate to ${actionId}`);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <GreetingSection />
        <StatsCards />
        <ActionButtons onActionPress={handleActionPress} />
        <ActivityFeed />
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
    flexGrow: 1,
    paddingBottom: 80, // Add padding to prevent content from going behind navbar
  },
});

export default Dashboard;
