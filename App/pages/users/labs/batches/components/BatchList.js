import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BatchCard from './BatchCard';

const BatchList = ({ 
  batches, 
  onStartVerification, 
  onContinueTesting, 
  onMarkDelivered, 
  onViewDetails, 
  onDownloadReport 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Batches</Text>
        <Text style={styles.count}>{batches.length} total</Text>
      </View>
      
      <View style={styles.listContent}>
        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onStartVerification={onStartVerification}
            onContinueTesting={onContinueTesting}
            onMarkDelivered={onMarkDelivered}
            onViewDetails={onViewDetails}
            onDownloadReport={onDownloadReport}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  count: {
    fontSize: 14,
    color: '#808080',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default BatchList;
