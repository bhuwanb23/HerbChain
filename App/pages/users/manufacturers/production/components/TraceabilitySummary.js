import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TraceabilitySummary = ({ summaryData }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Traceability Summary</Text>
      <View style={styles.summaryDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total Herbs:</Text>
          <Text style={styles.detailValue}>{summaryData.totalHerbs}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Processing Method:</Text>
          <Text style={styles.detailValue}>{summaryData.processingMethod}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Certification:</Text>
          <Text style={[styles.detailValue, styles.primaryText]}>{summaryData.certification}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{summaryData.created}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
    padding: 16,
    marginBottom: 24, // mb-6
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12, // mb-3
  },
  summaryDetails: {
    rowGap: 8, // space-y-2
    fontSize: 14, // text-sm
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#4b5563', // gray-600
  },
  detailValue: {
    fontWeight: '500',
    color: '#111827',
  },
  primaryText: {
    color: '#059669', // primary
  },
});

export default TraceabilitySummary;