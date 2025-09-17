import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useReportsTabs } from './hooks';
import {
  ReportsAnalytics,
  HistoryRecords,
  TabNavigation,
} from './components';

const ReportsPage = ({ navigation }) => {
  const { activeTab, switchTab, tabs } = useReportsTabs();

  const handleGenerateReport = (reportType) => {
    console.log('Generating report:', reportType);
    // Handle report generation
  };

  const handleRecordSelect = (record) => {
    console.log('Record selected:', record);
    // Navigate to record details or generate report for specific record
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'reports':
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
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={switchTab}
        tabs={tabs}
      />
      
      <View style={styles.content}>
        {renderCurrentTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
});

export default ReportsPage;
