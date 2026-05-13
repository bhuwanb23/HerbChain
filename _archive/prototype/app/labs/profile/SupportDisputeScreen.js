import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SupportDisputeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support & Dispute</Text>
      <Text>Raise issues or file disputes.</Text>
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

export default SupportDisputeScreen;