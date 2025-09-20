import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ScannedHerbDetails = ({ scannedHerb, getStatusStyle, onClearScannedDetails }) => {
  if (!scannedHerb) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="qr-code-scanner" size={60} color="#9ca3af" />
        <Text style={styles.emptyText}>Scan a QR code to see herb details</Text>
      </View>
    );
  }

  const statusStyle = getStatusStyle(scannedHerb.status);

  return (
    <View style={styles.container}>
      {/* Removed Header */}
      <View style={styles.cardContainer}>
        <View style={styles.batchSummaryHeader}>
          <Text style={styles.batchSummaryId}>{scannedHerb.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{scannedHerb.status}</Text>
          </View>
        </View>
        <Text style={styles.batchSummaryName}>{scannedHerb.name}</Text>
        <Text style={styles.batchSummaryFarmer}>{scannedHerb.farmer}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <View style={styles.certificationsList}>
            {scannedHerb.certifications && scannedHerb.certifications.length > 0 ? ( scannedHerb.certifications.map((cert, index) => (
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
              <Text style={styles.storageConditionValue}>{scannedHerb.temperature}</Text>
            </View>
            <View style={styles.storageConditionCard}>
              <View style={styles.storageConditionItem}>
                <Icon name="water-drop" size={20} color="#14b8a6" />
                <Text style={styles.storageConditionLabel}>Humidity</Text>
              </View>
              <Text style={styles.storageConditionValue}>{scannedHerb.humidity}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Traceability</Text>
          <View style={styles.traceabilityList}>
            <View style={styles.traceabilityItem}>
              <Text style={styles.traceabilityLabel}>Origin:</Text>
              <Text style={styles.traceabilityValue}>{scannedHerb.origin}</Text>
            </View>
            <View style={styles.traceabilityItem}>
              <Text style={styles.traceabilityLabel}>Harvest Date:</Text>
              <Text style={styles.traceabilityValue}>{scannedHerb.harvestDate}</Text>
            </View>
            <View style={styles.traceabilityItem}>
              <Text style={styles.traceabilityLabel}>Weight:</Text>
              <Text style={styles.traceabilityValue}>{scannedHerb.weight}</Text>
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.clearButtonFixed} onPress={onClearScannedDetails}>
        <Icon name="clear" size={20} color="#ef4444" />
        <Text style={styles.clearButtonTextFixed}>Clear Scanned Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    // paddingHorizontal: 16, // Removed as it will be handled by parent container
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Removed: header styles
  // Removed: backButton styles
  // Removed: backButtonText styles
  // Removed: title styles
  // Removed: clearButton styles
  // Removed: clearButtonText styles
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
    marginTop: 16,
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
  clearButtonFixed: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444', // red-500
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    columnGap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearButtonTextFixed: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ScannedHerbDetails;