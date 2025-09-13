import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LoginHeader = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.logoText}>🌿 HerbChain</Text>
      <Text style={styles.tagline}>From Roots to Remedies, Traced with Trust</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
});

export default LoginHeader;
