import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../../components';
import TransporterDashboard from './dashboard/dashboard';

const TransportersPage = ({ navigation }) => {
  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <TransporterDashboard navigation={navigation} />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default TransportersPage;
