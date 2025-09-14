import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  PendingBatches,
  UrgentRequests,
  CompletedAnalyses,
  Notifications,
} from './components';

const DashboardPage = ({ navigation }) => {
  const [pendingBatches] = useState([]);
  const [urgentRequests] = useState([]);
  const [completedAnalyses] = useState([]);
  const [notifications] = useState([]);

  const handleBatchPress = (batchId) => {
    console.log('Batch pressed:', batchId);
    // Navigate to batch verification page
  };

  const handleRequestPress = (requestId) => {
    console.log('Request pressed:', requestId);
    // Navigate to urgent request handling
  };

  const handleNotificationPress = (notificationId) => {
    console.log('Notification pressed:', notificationId);
    // Navigate to notification details or mark as read
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <PendingBatches 
          batches={pendingBatches}
          onBatchPress={handleBatchPress}
        />
        
        <UrgentRequests 
          requests={urgentRequests}
          onRequestPress={handleRequestPress}
        />
        
        <CompletedAnalyses 
          analyses={completedAnalyses}
        />
        
        <Notifications 
          notifications={notifications}
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default DashboardPage;