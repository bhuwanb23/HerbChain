import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliveryConfirmationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Confirmation (Lab Handover)</Text>
      <Text>Mark batch as complete and forward results.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default DeliveryConfirmationScreen;