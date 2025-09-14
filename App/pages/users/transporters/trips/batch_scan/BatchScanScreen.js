import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ScannerWindow,
  ScannerControls,
  BatchDetails,
  InvalidBatch,
  ActionButtons,
} from './components';
import { useBatchScan } from './hooks';

const BatchScanScreen = ({ tripData, onScanSuccess, onGoBack }) => {
  const {
    scannerState,
    batchData,
    isScanning,
    showBatchDetails,
    showInvalidBatch,
    showActionButtons,
    startScanning,
    stopScanning,
    handleManualEntry,
    handleFlashlightToggle,
    handleAcceptBatch,
    handleHandoverBatch,
    demoSuccessScan,
    demoInvalidScan,
  } = useBatchScan();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onGoBack}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* Scanner Window */}
          <ScannerWindow 
            isScanning={isScanning}
            onScanComplete={() => {}}
          />

          {/* Scanner Controls */}
          <ScannerControls
            onManualEntry={handleManualEntry}
            onFlashlightToggle={handleFlashlightToggle}
          />

          {/* Batch Details */}
          <BatchDetails
            batchData={batchData}
            isVisible={showBatchDetails}
          />

          {/* Invalid Batch */}
          <InvalidBatch
            isVisible={showInvalidBatch}
            errorMessage="This batch appears to be adulterated or does not match our quality standards."
          />

          {/* Action Buttons */}
          <ActionButtons
            isVisible={showActionButtons}
            onAcceptBatch={() => {
              handleAcceptBatch();
              // Navigate to active trip after successful batch acceptance
              setTimeout(() => {
                onScanSuccess && onScanSuccess(batchData);
              }, 2000);
            }}
            onHandoverBatch={handleHandoverBatch}
          />

          {/* Demo Buttons */}
          <View style={styles.demoContainer}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={demoSuccessScan}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#E5E7EB', '#D1D5DB']}
                style={styles.demoButtonGradient}
              >
                <Text style={styles.demoButtonText}>Demo: Show Success Scan</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={demoInvalidScan}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#E5E7EB', '#D1D5DB']}
                style={styles.demoButtonGradient}
              >
                <Text style={styles.demoButtonText}>Demo: Show Invalid Scan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  demoContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 12,
  },
  demoButton: {
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  demoButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});

export default BatchScanScreen;
