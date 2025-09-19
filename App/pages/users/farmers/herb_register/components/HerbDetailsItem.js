import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HerbDetailsItem = ({ batch }) => {
  if (!batch) return null;
  return (
    <View style={styles.card}>
      {/* Herb Photo */}
      {batch.image_url && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: batch.image_url }} 
            style={styles.herbImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.row}>
        <Icon name="qr-code" size={18} color="#22c55e" />
        <Text style={styles.id} numberOfLines={1}>{batch.batch_id}</Text>
        <View style={[styles.status, batch.is_active ? styles.active : styles.inactive]}>
          <Text style={styles.statusText}>{batch.status}</Text>
        </View>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Species</Text>
        <Text style={styles.value}>{batch.species_entered || batch.species_detected || '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Weight</Text>
        <Text style={styles.value}>{batch.weight_kg ? `${batch.weight_kg} kg` : '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Harvest</Text>
        <Text style={styles.value}>{batch.harvest_date ? batch.harvest_date : '-'}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Created</Text>
        <Text style={styles.value}>{batch.created_at ? batch.created_at.split('T')[0] : '-'}</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  id: {
    marginLeft: 6,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  active: {
    backgroundColor: '#22c55e',
  },
  inactive: {
    backgroundColor: '#9ca3af',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  herbImage: {
    width: '100%',
    height: 120,
  },
});

export default HerbDetailsItem;


