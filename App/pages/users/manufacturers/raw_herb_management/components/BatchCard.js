import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BatchCard = ({ batch, onPress }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return { backgroundColor: '#dcfce7', color: '#16a34a' }; // green-100, green-700
      case 'Pending':
        return { backgroundColor: '#fef9c3', color: '#a16207' }; // yellow-100, yellow-700
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' }; // gray-200, gray-600
    }
  };

  const statusStyle = getStatusStyle(batch.status);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(batch.id)}>
      <View style={styles.cardHeader}>
        <View style={styles.batchInfo}>
          <View style={styles.batchIdContainer}>
            <Text style={styles.batchId}>{batch.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>{batch.status}</Text>
            </View>
          </View>
          <Text style={styles.batchName}>{batch.name}</Text>
          <Text style={styles.farmerName}>{batch.farmer}</Text>
        </View>
        <View style={styles.weightInfo}>
          <Text style={styles.batchWeight}>{batch.weight}</Text>
          <Text style={styles.receivedTime}>Received: {batch.received}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.detailsRow}>
          {batch.status === 'Approved' && (
            <View style={styles.detailItem}>
              <Icon name="verified" size={12} color="#22c55e" />
              <Text style={styles.detailText}>Lab Certified</Text>
            </View>
          )}
          {batch.status === 'Pending' && (
            <View style={styles.detailItem}>
              <Icon name="schedule" size={12} color="#eab308" />
              <Text style={styles.detailText}>Lab Testing</Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Icon name="thermostat" size={12} color="#3b82f6" />
            <Text style={styles.detailText}>{batch.temperature}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, batch.status === 'Pending' && styles.disabledButton]}
          disabled={batch.status === 'Pending'}
        >
          <Text style={[styles.actionButtonText, batch.status === 'Pending' && styles.disabledButtonText]}>
            {batch.status === 'Pending' ? 'Pending' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  batchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  farmerName: {
    fontSize: 14,
    color: '#4b5563',
  },
  weightInfo: {
    alignItems: 'flex-end',
  },
  batchWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  receivedTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16, // space-x-4 equivalent
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4, // space-x-1 equivalent
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#6b7280',
  },
});

export default BatchCard;