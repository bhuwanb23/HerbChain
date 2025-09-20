import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProductionHeader = () => {
  const navigation = useNavigation();

  const handleSaveDraft = () => {
    Alert.alert('Save Draft', 'Functionality to save draft will be implemented here.');
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Creation</Text>
      </View>
      <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
        <Text style={styles.saveDraftButtonText}>Save Draft</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  saveDraftButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669', // primary
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669', // primary
  },
});

export default ProductionHeader;