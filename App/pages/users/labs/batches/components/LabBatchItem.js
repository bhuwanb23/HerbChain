import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

const LabBatchItem = ({ item, onAccepted, acceptHerb }) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const accept = async () => {
    try {
      setIsAccepting(true);
      console.log('[LabBatchItem] Accepting batch:', item.batch_id);
      
      if (acceptHerb) {
        await acceptHerb(item.batch_id);
        Alert.alert('Success', 'Herb accepted for testing successfully!');
        onAccepted && onAccepted();
      } else {
        // Fallback to dummy call
        setTimeout(() => {
          console.log('[LabBatchItem] Accept successful (dummy)');
          onAccepted && onAccepted();
        }, 1000);
      }
      
    } catch (e) {
      console.log('[LabBatchItem] accept failed', e);
      Alert.alert('Error', e.message || 'Failed to accept herb');
    } finally {
      setIsAccepting(false);
    }
  };
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
        <Text style={styles.value}>{item.accepted ? 'Accepted' : (item.status || 'Pending')}</Text>
      </View>
      {!item.accepted && (
        <TouchableOpacity 
          style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]} 
          onPress={accept} 
          activeOpacity={0.85}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.acceptText}>Accepting...</Text>
            </View>
          ) : (
            <Text style={styles.acceptText}>Accept for Testing</Text>
          )}
        </TouchableOpacity>
      )}
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
  acceptBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default LabBatchItem;


