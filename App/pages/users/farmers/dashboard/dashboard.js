import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { BottomNavbar } from '../components';
import {
  Header,
  GreetingSection,
  StatsCards,
  ActionButtons,
  ActivityFeed,
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


  return (
    <View style={styles.container}>
      <SafeAreaWrapper style={styles.safeArea} includeBottom={false}>
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
      </SafeAreaWrapper>
      
      <BottomNavbar navigation={navigation} activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default Dashboard;
