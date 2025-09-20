import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BatchDetailsModal = ({ isVisible, onClose, batch }) => {
  if (!batch) {
    return null;
  }

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
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Batch Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.batchSummaryCard}>
              <View style={styles.batchSummaryHeader}>
                <Text style={styles.batchSummaryId}>{batch.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{batch.status}</Text>
                </View>
              </View>
              <Text style={styles.batchSummaryName}>{batch.name}</Text>
              <Text style={styles.batchSummaryFarmer}>{batch.farmer}</Text>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.certificationsList}>
                {batch.certifications && batch.certifications.length > 0 ? ( batch.certifications.map((cert, index) => (
                  <View key={index} style={styles.certificationItem}>
                    <Icon name="verified" size={16} color="#22c55e" />
                    <Text style={styles.certificationText}>{cert}</Text>
                  </View>
                )) ) : (<Text style={styles.noCertificationsText}>No certifications available</Text>)}
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Storage Conditions</Text>
              <View style={styles.storageConditionsGrid}>
                <View style={styles.storageConditionCard}>
                  <View style={styles.storageConditionItem}>
                    <Icon name="thermostat" size={20} color="#3b82f6" />
                    <Text style={styles.storageConditionLabel}>Temperature</Text>
                  </View>
                  <Text style={styles.storageConditionValue}>{batch.temperature}</Text>
                </View>
                <View style={styles.storageConditionCard}>
                  <View style={styles.storageConditionItem}>
                    <Icon name="water-drop" size={20} color="#14b8a6" />
                    <Text style={styles.storageConditionLabel}>Humidity</Text>
                  </View>
                  <Text style={styles.storageConditionValue}>{batch.humidity}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Traceability</Text>
              <View style={styles.traceabilityList}>
                <View style={styles.traceabilityItem}>
                  <Text style={styles.traceabilityLabel}>Origin:</Text>
                  <Text style={styles.traceabilityValue}>{batch.origin}</Text>
                </View>
                <View style={styles.traceabilityItem}>
                  <Text style={styles.traceabilityLabel}>Harvest Date:</Text>
                  <Text style={styles.traceabilityValue}>{batch.harvestDate}</Text>
                </View>
                <View style={styles.traceabilityItem}>
                  <Text style={styles.traceabilityLabel}>Weight:</Text>
                  <Text style={styles.traceabilityValue}>{batch.weight}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirm Ownership</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  modalBody: {
    paddingBottom: 20,
  },
  batchSummaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  batchSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  batchSummaryId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
  batchSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  batchSummaryFarmer: {
    fontSize: 14,
    color: '#4b5563',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  certificationsList: {
    rowGap: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  certificationText: {
    fontSize: 14,
    color: '#4b5563',
  },
  noCertificationsText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  storageConditionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  storageConditionCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
  },
  storageConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 4,
  },
  storageConditionLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  storageConditionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  traceabilityList: {
    rowGap: 8,
  },
  traceabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  traceabilityLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  traceabilityValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BatchDetailsModal;