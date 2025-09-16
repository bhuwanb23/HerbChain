import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DocRow = ({ icon, title, status, meta, onUpload }) => {
  const isVerified = status === 'verified';
  const isMissing = status === 'missing';
  const isExpiring = status === 'expiring';

  return (
    <View style={[styles.docRow, isVerified && styles.docVerified, isMissing && styles.docMissing, isExpiring && styles.docExpiring]}>
      <View style={styles.docLeft}>
        <Icon
          name={isVerified ? 'badge' : isMissing ? 'shield' : 'workspace-premium'}
          size={18}
          color={isVerified ? '#16A34A' : isMissing ? '#6B7280' : '#CA8A04'}
          style={styles.docIcon}
        />
        <View>
          <Text style={styles.docTitle}>{title}</Text>
          {meta ? (
            <Text style={[styles.docMeta, isExpiring && { color: '#CA8A04' }]}>{meta}</Text>
          ) : isVerified ? (
            <Text style={[styles.docMeta, { color: '#16A34A' }]}>Verified</Text>
          ) : null}
        </View>
      </View>
      {isMissing ? (
        <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      ) : (
        <Icon name={isExpiring ? 'warning-amber' : 'check-circle'} size={18} color={isExpiring ? '#CA8A04' : '#16A34A'} />
      )}
    </View>
  );
};

const DocumentsSection = ({ documents, onUploadDocument }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      <View style={styles.stack}>
        {documents.map((d) => (
          <DocRow
            key={d.id}
            title={d.title}
            status={d.status}
            meta={d.meta}
            onUpload={() => onUploadDocument(d.id)}
          />)
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  stack: {
    gap: 8,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  docVerified: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  docMissing: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  docExpiring: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIcon: {
    marginRight: 12,
  },
  docTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  docMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  uploadBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DocumentsSection;


