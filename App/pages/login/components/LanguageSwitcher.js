import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Animated } from 'react-native';

const LanguageSwitcher = ({ onLanguageChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'हिं', name: 'Hindi', flag: '🇮🇳' },
    { code: 'తె', name: 'Telugu', flag: '🇮🇳' },
    { code: 'த', name: 'Tamil', flag: '🇮🇳' },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.code);
    setModalVisible(false);
    onLanguageChange && onLanguageChange(language);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>{selectedLang?.flag || '🌍'}</Text>
          </View>
          <Text style={styles.selectedText}>{selectedLanguage}</Text>
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.selectedItem,
                  ]}
                  onPress={() => handleLanguageSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemContent}>
                    <Text style={styles.languageFlag}>{item.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text
                        style={[
                          styles.languageCode,
                          selectedLanguage === item.code && styles.selectedLanguageCode,
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[
                          styles.languageName,
                          selectedLanguage === item.code && styles.selectedLanguageName,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    {selectedLanguage === item.code && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkIcon}>✓</Text>
                      </View>
                    )}
                  </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  flagContainer: {
    marginRight: 8,
  },
  flag: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  dropdownContainer: {
    marginLeft: 8,
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 300,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  languageItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  selectedItem: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedLanguageCode: {
    color: '#10B981',
  },
  languageName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedLanguageName: {
    color: '#059669',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LanguageSwitcher;
