import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const LanguageFilter = ({ languages, selectedLanguage, onLanguageChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>
      <View style={styles.languageContainer}>
        {languages.map((language) => (
          <TouchableOpacity
            key={language.id}
            style={[
              styles.languageButton,
              selectedLanguage === language.id && styles.activeButton
            ]}
            onPress={() => onLanguageChange(language.id)}
          >
            <Text style={[
              styles.languageText,
              selectedLanguage === language.id && styles.activeText
            ]}>
              {language.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: '#22c55e',
  },
  languageText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  activeText: {
    color: 'white',
  },
});

export default LanguageFilter;
