import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EXPORT_OPTIONS } from '../constants';

const ExportShare = ({ onExportPDF, onExportExcel, onShareWithAYUSH }) => {
  const handleExport = (format) => {
    switch (format) {
      case 'pdf':
        onExportPDF && onExportPDF();
        break;
      case 'excel':
        onExportExcel && onExportExcel();
        break;
      default:
        console.log(`Export ${format} not implemented`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.exportShareCard}>
        <Text style={styles.sectionTitle}>Export & Share</Text>
        <View style={styles.gridContainerSmall}>
          {EXPORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleExport(option.id)}
              style={styles.exportButton}
              activeOpacity={0.8}
            >
              <Icon name={option.icon} size={20} color={option.color} />
              <Text style={styles.exportButtonText}>{option.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          onPress={() => onShareWithAYUSH && onShareWithAYUSH()}
          style={styles.shareAyushButton}
          activeOpacity={0.8}
        >
          <Icon name="share" size={20} color="#FFFFFF" />
          <Text style={styles.shareAyushButtonText}>Share with AYUSH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
  },
  exportShareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  gridContainerSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    flex: 1,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  shareAyushButton: {
    width: '100%',
    backgroundColor: '#00BFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  shareAyushButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default ExportShare;
