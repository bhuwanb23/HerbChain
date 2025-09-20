import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ComplianceDocumentItem = ({ document, onDownloadDocument }) => {
  return (
    <View style={styles.documentCard}>
      <View style={styles.documentInfo}>
        <Icon
          name={document.icon}
          size={24}
          color={document.fileType === 'pdf' ? '#ef4444' : '#10b981'} // red-500 or green-500
          style={styles.documentIcon}
        />
        <View>
          <Text style={styles.documentName}>{document.name}</Text>
          <Text style={styles.uploadedTime}>Uploaded {document.uploaded}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => onDownloadDocument(document.id)} style={styles.downloadButton}>
        <Icon name="download" size={20} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 8,
    padding: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    marginRight: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  uploadedTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  downloadButton: {
    padding: 8,
  },
});

export default ComplianceDocumentItem;