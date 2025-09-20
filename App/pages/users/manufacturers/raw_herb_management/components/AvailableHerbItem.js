import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AvailableHerbItem = ({ herb, onOrderHerb, getStatusStyle, onPress }) => {
  const statusStyle = getStatusStyle(herb.status);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(herb)}>
      <View style={styles.header}>
        <Text style={styles.herbName}>{herb.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{herb.status}</Text>
        </View>
      </View>
      <Text style={styles.farmerName}>{herb.farmer}</Text>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Icon name="grass" size={16} color="#16a34a" />
          <Text style={styles.detailText}>{herb.weight}</Text>
        </View>
        {herb.certifications && herb.certifications.length > 0 && (
          <View style={styles.detailItem}>
            <Icon name="verified" size={16} color="#22c55e" />
            <Text style={styles.detailText}>Certified</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.orderButton} onPress={() => onOrderHerb(herb.id)}>
        <Text style={styles.orderButtonText}>Order Herb</Text>
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
  orderButton: {
    backgroundColor: '#059669', // primary
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AvailableHerbItem;