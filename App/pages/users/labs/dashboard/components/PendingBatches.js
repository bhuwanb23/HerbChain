import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const PendingBatches = ({ batches = [], onBatchPress }) => {
  const defaultBatches = [
    {
      id: 'BATCH-001',
      herbType: 'Ashwagandha',
      farmer: 'Rajesh Kumar',
      region: 'Madhya Pradesh',
      priority: 'high',
      receivedDate: '2024-01-15',
      status: 'pending',
    },
    {
      id: 'BATCH-002',
      herbType: 'Tulsi',
      farmer: 'Priya Sharma',
      region: 'Uttar Pradesh',
      priority: 'medium',
      receivedDate: '2024-01-14',
      status: 'pending',
    },
    {
      id: 'BATCH-003',
      herbType: 'Neem',
      farmer: 'Amit Singh',
      region: 'Rajasthan',
      priority: 'low',
      receivedDate: '2024-01-13',
      status: 'pending',
    },
  ];

  const displayBatches = batches.length > 0 ? batches : defaultBatches;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Batches</Text>
        <TouchableOpacity onPress={() => onBatchPress && onBatchPress('all')} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayBatches.map((batch) => (
          <TouchableOpacity
            key={batch.id}
            style={styles.batchCard}
            onPress={() => onBatchPress && onBatchPress(batch.id)}
            activeOpacity={0.7}
          >
            <View style={styles.batchHeader}>
              <Text style={styles.batchId}>{batch.id}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(batch.priority) }]}>
                <Text style={styles.priorityText}>{batch.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.herbType}>{batch.herbType}</Text>
            <View style={styles.batchDetails}>
              <Text style={styles.detailText}>👨‍🌾 {batch.farmer}</Text>
              <Text style={styles.detailText}>📍 {batch.region}</Text>
            </View>
            <Text style={styles.receivedDate}>Received: {batch.receivedDate}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  herbType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  batchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  receivedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default PendingBatches;
