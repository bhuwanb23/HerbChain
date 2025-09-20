import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DocumentUploadCard = ({ onUploadDocument }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onUploadDocument}>
      <Icon name="cloud_upload" size={32} color="#9ca3af" />
      <Text style={styles.uploadText}>Tap to upload documents</Text>
      <Text style={styles.infoText}>PDF, DOC, XLSX up to 10MB</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 14,
    color: '#4b5563', // gray-600
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginTop: 4,
  },
});

export default DocumentUploadCard;