import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useReportsActions } from '../hooks';
import GenerateReports from './GenerateReports';
import ChartComponent from './ChartComponent';

const ReportsAnalytics = ({ onGenerateReport }) => {
  const {
    handleGenerateChart,
    handleGenerateReport,
    handleViewHeatmap,
  } = useReportsActions();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <GenerateReports 
          onGenerateChart={handleGenerateChart}
          onGenerateReport={handleGenerateReport}
          onViewHeatmap={handleViewHeatmap}
        />
        
        <ChartComponent 
          chartType="contaminantTrends"
          onDownload={(type) => console.log(`Download ${type} chart`)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
});

export default ReportsAnalytics;
