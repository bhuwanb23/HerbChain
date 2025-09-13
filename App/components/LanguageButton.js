import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const LanguageButton = ({ language, onPress }) => {
  return (
    <TouchableOpacity style={styles.languageButton} onPress={onPress}>
      <Text style={styles.globeIcon}>🌍</Text>
      <Text style={styles.languageText}>{language}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  globeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  languageText: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LanguageButton;
