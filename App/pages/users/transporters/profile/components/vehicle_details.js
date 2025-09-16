import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const VehicleDetails = ({ vehicle, onEdit }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Vehicle Details</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.label}>License Plate</Text>
          <Text style={styles.value}>{vehicle.licensePlate}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Capacity</Text>
          <Text style={styles.value}>{vehicle.capacity}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  edit: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  item: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default VehicleDetails;


