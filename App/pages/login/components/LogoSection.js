import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGlobalTranslation } from '../../../language/GlobalTranslationContext';

const LogoSection = () => {
  const { t } = useGlobalTranslation();
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.leafIcon}>🌿</Text>
        </View>
      </View>
      <Text style={styles.title}>{t.login.appName}</Text>
      <Text style={styles.tagline}>
        {t.login.tagline}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#10B981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  leafIcon: {
    fontSize: 24,
    color: 'white',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 200,
  },
});

export default LogoSection;
