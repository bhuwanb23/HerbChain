import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RawHerbManagementPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Raw Herb Management</Text>
      <Text style={styles.subtitle}>Manage incoming herbs and their quality/storage conditions.</Text>
      {/* Further components for Incoming Batches, Batch Details View, etc., will be added here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0FDF4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default RawHerbManagementPage;