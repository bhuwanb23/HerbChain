import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

const TestingResultsEntry = ({ batchData, onResultsSubmit }) => {
  const [testResults, setTestResults] = useState({
    moistureContent: '',
    pesticideResidue: '',
    phytochemicalLevel: '',
    heavyMetals: '',
    microbialCount: '',
    notes: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleInputChange = (field, value) => {
    setTestResults(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (fileType) => {
    // Simulate file upload
    const newFile = {
      id: Date.now(),
      type: fileType,
      name: `${fileType}_${Date.now()}.jpg`,
      uploadedAt: new Date().toISOString(),
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    Alert.alert('Success', `${fileType} uploaded successfully!`);
  };

  const handleSubmit = () => {
    const requiredFields = ['moistureContent', 'pesticideResidue', 'phytochemicalLevel'];
    const missingFields = requiredFields.filter(field => !testResults[field]);
    
    if (missingFields.length > 0) {
      Alert.alert('Missing Data', 'Please fill in all required test results.');
      return;
    }

    Alert.alert(
      'Submit Results',
      'Are you sure you want to submit these test results?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            onResultsSubmit && onResultsSubmit(testResults, uploadedFiles);
            Alert.alert('Success', 'Test results submitted successfully!');
          }
        },
      ]
    );
  };

  const testFields = [
    {
      key: 'moistureContent',
      label: 'Moisture Content (%)',
      placeholder: 'Enter moisture percentage',
      required: true,
    },
    {
      key: 'pesticideResidue',
      label: 'Pesticide Residue (ppm)',
      placeholder: 'Enter pesticide residue level',
      required: true,
    },
    {
      key: 'phytochemicalLevel',
      label: 'Phytochemical Level (%)',
      placeholder: 'Enter phytochemical percentage',
      required: true,
    },
    {
      key: 'heavyMetals',
      label: 'Heavy Metals (ppm)',
      placeholder: 'Enter heavy metals level',
      required: false,
    },
    {
      key: 'microbialCount',
      label: 'Microbial Count (CFU/g)',
      placeholder: 'Enter microbial count',
      required: false,
    },
  ];

  const fileTypes = [
    { type: 'certificate', label: 'Lab Certificate', icon: '📋' },
    { type: 'microscope', label: 'Microscope Images', icon: '🔬' },
    { type: 'chromatogram', label: 'Chromatogram', icon: '📊' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Testing & Results Entry</Text>
      
      <View style={styles.batchInfo}>
        <Text style={styles.batchId}>Batch: BATCH-001</Text>
        <Text style={styles.herbType}>Ashwagandha</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.testResultsSection}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          
          {testFields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={field.placeholder}
                value={testResults[field.key]}
                onChangeText={(value) => handleInputChange(field.key, value)}
                keyboardType="numeric"
              />
            </View>
          ))}
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Enter any additional observations or notes..."
              value={testResults.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.fileUploadSection}>
          <Text style={styles.sectionTitle}>Upload Documents</Text>
          
          {fileTypes.map((fileType) => (
            <TouchableOpacity
              key={fileType.type}
              style={styles.uploadButton}
              onPress={() => handleFileUpload(fileType.type)}
            >
              <Text style={styles.uploadIcon}>{fileType.icon}</Text>
              <Text style={styles.uploadText}>{fileType.label}</Text>
            </TouchableOpacity>
          ))}
          
          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFiles}>
              <Text style={styles.uploadedFilesTitle}>Uploaded Files:</Text>
              {uploadedFiles.map((file) => (
                <View key={file.id} style={styles.uploadedFile}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileType}>{file.type}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>📤 Submit Test Results</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  batchInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  herbType: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  scrollContainer: {
    maxHeight: 500,
  },
  testResultsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  fileUploadSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  uploadedFiles: {
    marginTop: 16,
  },
  uploadedFilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  uploadedFile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#111827',
  },
  fileType: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestingResultsEntry;
