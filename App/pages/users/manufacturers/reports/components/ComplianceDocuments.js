import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentUploadCard from './DocumentUploadCard';
import ComplianceDocumentItem from './ComplianceDocumentItem';

const ComplianceDocuments = ({ complianceDocumentsData, onUploadDocument, onDownloadDocument }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Documents</Text>
        <Icon name="upload_file" size={20} color="#a855f7" />
      </View>
      <DocumentUploadCard onUploadDocument={onUploadDocument} />
      <FlatList
        data={complianceDocumentsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ComplianceDocumentItem document={item} onDownloadDocument={onDownloadDocument} />
        )}
        contentContainerStyle={styles.documentListContent}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  documentListContent: {
    rowGap: 12, // space-y-2
  },
});

export default ComplianceDocuments;