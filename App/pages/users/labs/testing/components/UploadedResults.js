import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UploadedResults = ({ reports }) => {
  if (!reports || reports.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Uploaded Results</Text>
      {reports.map((r) => (
        <View key={r.report_id} style={styles.row}> 
          <Text style={styles.label}>{r.test_type || 'general'}</Text>
          <Text style={styles.value} numberOfLines={2}>{r.results_summary}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    marginTop: 8,
  },
  label: {
    color: '#6B7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  }
});

export default UploadedResults;


