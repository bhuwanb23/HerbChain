import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DashboardCard from './DashboardCard';

const QuickStats = () => {
  return (
    <View style={styles.container}>
      <DashboardCard
        title="Active Batches"
        value="12"
        iconName="spa"
        color="#7C9885" // herb-green
      />
      <DashboardCard
        title="Pending Deliveries"
        value="8"
        iconName="local-shipping"
        color="#f59e0b" // amber
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10, // Add some horizontal padding to match HTML
  },
});

export default QuickStats;