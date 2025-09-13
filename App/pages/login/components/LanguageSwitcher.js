import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

const LanguageSwitcher = ({ onLanguageChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [modalVisible, setModalVisible] = useState(false);

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'हिं', name: 'Hindi' },
    { code: 'తె', name: 'Telugu' },
    { code: 'த', name: 'Tamil' },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.code);
    setModalVisible(false);
    onLanguageChange && onLanguageChange(language);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectedText}>{selectedLanguage}</Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.selectedItem,
                  ]}
                  onPress={() => handleLanguageSelect(item)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage === item.code && styles.selectedText,
                    ]}
                  >
                    {item.code}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 32,
    right: 24,
    zIndex: 10,
  },
  selector: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  selectedText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  languageItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedItem: {
    backgroundColor: '#E8F5E8',
  },
  languageText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
});

export default LanguageSwitcher;
