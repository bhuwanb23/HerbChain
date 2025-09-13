import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FooterLinks = ({ onPrivacyPolicy, onTermsOfService }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrivacyPolicy}>
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onTermsOfService}>
        <Text style={styles.link}>Terms of Service</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 32,
  },
  link: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default FooterLinks;
