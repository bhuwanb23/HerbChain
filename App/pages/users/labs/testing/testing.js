import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TestingResultsEntry,
  OfflineSync,
} from './components';

const TestingPage = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState('results');
  const [selectedBatch, setSelectedBatch] = useState('BATCH-001');

  const handleResultsSubmit = (results, files) => {
    console.log('Results submitted:', results, files);
    // Handle results submission
  };

  const handleSyncComplete = () => {
    console.log('Sync completed');
    // Handle sync completion
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'results':
        return (
          <TestingResultsEntry 
            batchData={selectedBatch}
            onResultsSubmit={handleResultsSubmit}
          />
        );
      case 'sync':
        return (
          <OfflineSync 
            onSyncComplete={handleSyncComplete}
          />
        );
      default:
        return (
          <TestingResultsEntry 
            batchData={selectedBatch}
            onResultsSubmit={handleResultsSubmit}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabButtons}>
          <View
            style={[
              styles.tabButton,
              currentTab === 'results' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'results' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('results')}
            >
              🧪 Results Entry
            </Text>
          </View>
          <View
            style={[
              styles.tabButton,
              currentTab === 'sync' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'sync' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('sync')}
            >
              📱 Offline Sync
            </Text>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default TestingPage;
