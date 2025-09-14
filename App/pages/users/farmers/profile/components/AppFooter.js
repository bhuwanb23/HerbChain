import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppFooter = () => {
  return (
    <View style={styles.container}>
      <View style={styles.footerContent}>
        <Text style={styles.versionText}>HerbChain Version 2.1.3</Text>
        <Text style={styles.copyrightText}>© 2024 Agricultural Solutions</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerContent: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  copyrightText: {
    fontSize: 10,
    color: '#6B7280',
  },
});

export default AppFooter;
