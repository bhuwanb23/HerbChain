import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

const BatchVerification = ({ onBatchLoad }) => {
  const [batchId, setBatchId] = useState('');
  const [scanMode, setScanMode] = useState(false);

  const handleScanQR = () => {
    setScanMode(true);
    // Simulate QR scan
    setTimeout(() => {
      setBatchId('BATCH-001');
      setScanMode(false);
    }, 2000);
  };

  const handleManualEntry = () => {
    if (batchId.trim()) {
      onBatchLoad && onBatchLoad(batchId);
    }
  };

  const mockBatchData = {
    id: 'BATCH-001',
    herbType: 'Ashwagandha',
    farmer: 'Rajesh Kumar',
    transporter: 'Green Logistics',
    storage: 'Cold Storage Unit A',
    journey: [
      { step: 'Harvested', location: 'Farm', timestamp: '2024-01-10 08:00' },
      { step: 'Processed', location: 'Processing Unit', timestamp: '2024-01-11 14:30' },
      { step: 'Transported', location: 'In Transit', timestamp: '2024-01-12 10:15' },
      { step: 'Stored', location: 'Cold Storage', timestamp: '2024-01-13 16:45' },
      { step: 'Received', location: 'Lab', timestamp: '2024-01-15 09:30' },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batch Verification</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Scan QR or Enter Batch ID</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Batch ID (e.g., BATCH-001)"
            value={batchId}
            onChangeText={setBatchId}
            editable={!scanMode}
          />
          <TouchableOpacity
            style={[styles.scanButton, scanMode && styles.scanButtonActive]}
            onPress={handleScanQR}
            disabled={scanMode}
          >
            <Text style={styles.scanButtonText}>
              {scanMode ? 'Scanning...' : '📷 Scan QR'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.loadButton, !batchId.trim() && styles.loadButtonDisabled]}
          onPress={handleManualEntry}
          disabled={!batchId.trim()}
        >
          <Text style={styles.loadButtonText}>Load Batch Details</Text>
        </TouchableOpacity>
      </View>

      {batchId && (
        <View style={styles.batchDetails}>
          <Text style={styles.sectionTitle}>Batch Journey</Text>
          <ScrollView style={styles.journeyContainer}>
            {mockBatchData.journey.map((step, index) => (
              <View key={index} style={styles.journeyStep}>
                <View style={styles.stepIndicator}>
                  <View style={[styles.stepDot, index === mockBatchData.journey.length - 1 && styles.currentStep]} />
                  {index < mockBatchData.journey.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.step}</Text>
                  <Text style={styles.stepLocation}>{step.location}</Text>
                  <Text style={styles.stepTimestamp}>{step.timestamp}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => onBatchLoad && onBatchLoad(batchId)}
          >
            <Text style={styles.verifyButtonText}>✅ Verify & Proceed to Testing</Text>
          </TouchableOpacity>
        </View>
      )}
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
  inputSection: {
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
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonActive: {
    backgroundColor: '#6B7280',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  loadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  batchDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  journeyContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  journeyStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
  },
  currentStep: {
    backgroundColor: '#8B5CF6',
  },
  stepLine: {
    width: 2,
    height: 30,
    backgroundColor: '#D1D5DB',
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  verifyButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BatchVerification;
