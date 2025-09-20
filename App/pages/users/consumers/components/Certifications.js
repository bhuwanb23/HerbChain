import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const Certifications = ({ certifications }) => {
  const getIconName = (iconType) => {
    switch (iconType) {
      case 'leaf':
        return 'leaf-outline';
      case 'shield-check':
        return 'shield-checkmark-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Certifications</Text>
      <View style={styles.grid}>
        {certifications.map((cert) => (
          <View key={cert.id} style={styles.certItem}>
            <Ionicons 
              name={getIconName(cert.icon)} 
              size={32} 
              color={COLORS.sage} 
              style={styles.icon}
            />
            <Text style={styles.certText}>{cert.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  certItem: {
    flex: 1,
    backgroundColor: COLORS.warmBeige,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  certText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.earthBrown,
    textAlign: 'center',
  },
});

export default Certifications;
