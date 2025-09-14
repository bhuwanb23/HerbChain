import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  ReportsAnalytics,
  HistoryRecords,
} from './components';

const ReportsPage = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState('analytics');

  const handleGenerateReport = (reportType) => {
    console.log('Generating report:', reportType);
    // Handle report generation
  };

  const handleRecordSelect = (record) => {
    console.log('Record selected:', record);
    // Navigate to record details or generate report for specific record
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'analytics':
        return (
          <ReportsAnalytics 
            onGenerateReport={handleGenerateReport}
          />
        );
      case 'history':
        return (
          <HistoryRecords 
            onRecordSelect={handleRecordSelect}
          />
        );
      default:
        return (
          <ReportsAnalytics 
            onGenerateReport={handleGenerateReport}
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
              currentTab === 'analytics' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'analytics' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('analytics')}
            >
              📊 Analytics
            </Text>
          </View>
          <View
            style={[
              styles.tabButton,
              currentTab === 'history' && styles.activeTabButton
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                currentTab === 'history' && styles.activeTabButtonText
              ]}
              onPress={() => setCurrentTab('history')}
            >
              📜 History
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

export default ReportsPage;
