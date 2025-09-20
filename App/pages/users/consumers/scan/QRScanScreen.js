import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { Ionicons } from '@expo/vector-icons';
import QRScanner from '../components/QRScanner';
import { useConsumerAPI } from '../hooks/useConsumerAPI';

const QRScanScreen = ({ navigation }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [manualBatchId, setManualBatchId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const { 
    loading, 
    error, 
    fetchHerbDetails, 
    validateBatchId, 
    parseQRData, 
    showError, 
    clearError 
  } = useConsumerAPI();

  const handleQRScan = async (scannedData) => {
    setShowScanner(false);
    
    try {
      const batchId = parseQRData(scannedData);
      
      if (!validateBatchId(batchId)) {
        showError('Invalid QR code format. Please scan a valid herb batch QR code.');
        return;
      }

      await fetchAndDisplayHerbDetails(batchId);
    } catch (error) {
      console.error('Error processing QR scan:', error);
      showError('Error processing QR code. Please try again.');
    }
  };

  const handleManualSubmit = async () => {
    if (!manualBatchId.trim()) {
      showError('Please enter a batch ID');
      return;
    }

    const batchId = manualBatchId.trim();
    
    if (!validateBatchId(batchId)) {
      showError('Invalid batch ID format. Please enter a valid batch ID.');
      return;
    }

    await fetchAndDisplayHerbDetails(batchId);
  };

  const fetchAndDisplayHerbDetails = async (batchId) => {
    try {
      clearError();
      const herbData = await fetchHerbDetails(batchId);
      
      if (herbData) {
        // Navigate to herb details screen with the fetched data
        navigation.navigate('HerbDetailsScreen', {
          herbData: herbData.herb,
          ownershipHistory: herbData.ownershipHistory,
          currentOwner: herbData.currentOwner,
          batchId: batchId,
        });
      } else {
        showError(error || 'Failed to fetch herb details. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching herb details:', error);
      showError('Failed to fetch herb details. Please try again.');
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const handleScanAgain = () => {
    setShowScanner(true);
  };

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    setManualBatchId('');
  };

  if (showScanner) {
    return (
      <QRScanner
        onScan={handleQRScan}
        onClose={handleCloseScanner}
        visible={showScanner}
      />
    );
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Herb QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Scan Instructions */}
          <View style={styles.instructionCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="qr-code" size={48} color="#87A96B" />
            </View>
            <Text style={styles.instructionTitle}>Scan Herb QR Code</Text>
            <Text style={styles.instructionText}>
              Point your camera at the QR code on your herb product to view detailed information about its origin, quality, and journey.
            </Text>
          </View>

          {/* Scan Button */}
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScanAgain}
            disabled={loading}
          >
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>
              {loading ? 'Loading...' : 'Scan QR Code'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual Input */}
          <TouchableOpacity 
            style={styles.manualButton} 
            onPress={toggleManualInput}
          >
            <Ionicons name="keypad" size={20} color="#87A96B" />
            <Text style={styles.manualButtonText}>Enter Batch ID Manually</Text>
          </TouchableOpacity>

          {/* Manual Input Field */}
          {showManualInput && (
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.manualInput}
                placeholder="Enter batch ID (e.g., HERB-ASH-001)"
                value={manualBatchId}
                onChangeText={setManualBatchId}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleManualSubmit}
              />
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleManualSubmit}
                disabled={loading || !manualBatchId.trim()}
              >
                <Text style={styles.submitButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.helpText}>
              QR codes are found on herb product packaging and contain unique batch identification information.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#87A96B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#87A96B',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  manualButtonText: {
    color: '#87A96B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualInputContainer: {
    marginBottom: 24,
  },
  manualInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#87A96B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default QRScanScreen;
