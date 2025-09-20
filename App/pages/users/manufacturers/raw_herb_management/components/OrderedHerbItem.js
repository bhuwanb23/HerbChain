import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderedHerbItem = ({ herb, getStatusStyle, onPress, onScanQRCode }) => {
  const statusStyle = getStatusStyle(herb.status);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(herb)}>
      <View style={styles.header}>
        <Text style={styles.herbName}>{herb.species_name || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{herb.status}</Text>
        </View>
      </View>
      <Text style={styles.farmerName}>Farmer: {herb?.farmer_user?.name || herb.farmer_id || 'N/A'}</Text>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="inventory" size={16} color="#4b5563" />
          <Text style={styles.detailText}>{herb.weight_kg ? `${herb.weight_kg} kg` : 'N/A'}</Text>
        </View>
        {herb.orderDate && (
          <View style={styles.detailItem}>
            <Icon name="access-time" size={16} color="#4b5563" />
            <Text style={styles.detailText}>Ordered: {new Date(herb.orderDate).toLocaleDateString()}</Text>
          </View>
        )}
        {herb.labReports && herb.labReports.length > 0 && herb.labReports[0]?.certification && (
          <View style={styles.detailItem}>
            <Icon name="verified" size={16} color="#22c55e" />
            <Text style={styles.detailText}>Certified</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.scanButton} onPress={() => onScanQRCode(herb.id)}>
        <Icon name="qr-code-scanner" size={20} color="#fff" />
        <Text style={styles.scanButtonText}>Scan QR</Text>
      </TouchableOpacity>
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
    marginBottom: 10, // Added margin bottom for spacing between items
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  herbName: {
    fontSize: 16,
    fontWeight: '600',
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
  farmerName: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16, // space-x-4 equivalent
    marginBottom: 16,
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
  scanButton: {
    backgroundColor: '#059669', // primary
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 8,
    marginTop: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OrderedHerbItem;