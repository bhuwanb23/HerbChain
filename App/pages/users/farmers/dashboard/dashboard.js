import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Header,
  GreetingSection,
  StatsCards,
  ActionButtons,
  ActivityFeed,
  BottomAction,
} from './components';

const Dashboard = ({ navigation }) => {
  const handleActionPress = (actionId) => {
    switch (actionId) {
      case 'herb-batches':
        Alert.alert('Navigation', 'Navigate to Herb Batches');
        break;
      case 'sales-revenue':
        Alert.alert('Navigation', 'Navigate to Sales & Revenue');
        break;
      case 'harvest-schedule':
        Alert.alert('Navigation', 'Navigate to Harvest Schedule');
        break;
      case 'training-tips':
        Alert.alert('Navigation', 'Navigate to Training & Tips');
        break;
      default:
        Alert.alert('Navigation', `Navigate to ${actionId}`);
    }
  };

  const handleRegisterHerb = () => {
    Alert.alert('Register Herb', 'Navigate to Herb Registration');
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.container}>
        <Header navigation={navigation} />
        
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

        <BottomAction onRegisterHerb={handleRegisterHerb} />
      </View>
    </SafeAreaProvider>
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
  },
});

export default Dashboard;
