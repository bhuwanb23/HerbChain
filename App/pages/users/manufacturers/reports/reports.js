import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportsPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports & Compliance</Text>
      <Text style={styles.subtitle}>Access production reports, herb lineage, and manage regulatory compliance.</Text>
      {/* Further components for Production Reports, Herb Lineage Reports, etc., will be added here */}
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

export default ReportsPage;