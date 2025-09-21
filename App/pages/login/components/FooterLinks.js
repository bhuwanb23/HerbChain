import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../language/TranslationContext';

const FooterLinks = ({ onPrivacyPolicy, onTermsOfService }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrivacyPolicy}>
        <Text style={styles.link}>{t.privacyPolicy}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onTermsOfService}>
        <Text style={styles.link}>{t.termsOfService}</Text>
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
