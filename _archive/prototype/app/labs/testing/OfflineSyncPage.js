import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OfflineSyncPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Sync</Text>
      <Text>Store test results offline and auto-sync later.</Text>
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

export default OfflineSyncPage;