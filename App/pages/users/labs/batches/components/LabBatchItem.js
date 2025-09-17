import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LabBatchItem = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Batch ID</Text>
        <Text style={styles.value}>{item.batch_id}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Farmer</Text>
        <Text style={styles.value}>{item.farmer_id}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Species</Text>
        <Text style={styles.value}>{item.species_entered || item.species_detected || '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Weight</Text>
        <Text style={styles.value}>{item.weight_kg ? `${item.weight_kg} kg` : '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Harvest</Text>
        <Text style={styles.value}>{item.harvest_date || '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{item.status || '-'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
});

export default LabBatchItem;


