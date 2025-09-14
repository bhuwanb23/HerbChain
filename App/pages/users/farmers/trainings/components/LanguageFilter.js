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
    marginTop: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  languageButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeButton: {
    backgroundColor: '#22c55e',
  },
  languageText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  activeText: {
    color: 'white',
  },
});

export default LanguageFilter;
