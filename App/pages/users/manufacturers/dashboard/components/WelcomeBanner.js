import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WelcomeBanner = ({ manufacturerName }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Hello {manufacturerName},</Text>
      <Text style={styles.overviewText}>here’s today’s overview.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  overviewText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default WelcomeBanner;