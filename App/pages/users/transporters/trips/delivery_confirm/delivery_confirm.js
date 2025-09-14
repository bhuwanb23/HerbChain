import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import {
  QRScanner,
  ScanStatus,
  SuccessAnimation,
  ReceiverInfo,
  BatchInfo,
  AuthenticationSection,
  ConfirmButton,
  SuccessScreen,
  ErrorAlert,
} from './components';
import { useDeliveryConfirm } from './hooks';
import { DELIVERY_STATES } from './constants';

const DeliveryConfirmScreen = ({ tripData, batchData, receiverData, onDeliveryComplete, onGoBack }) => {
  const {
    currentState,
    isScanning,
    scanStatus,
    selectedAuthMethod,
    isLoading,
    showError,
    errorMessage,
    receiverData: hookReceiverData,
    batchData: hookBatchData,
    transactionData,
    simulateQRScan,
    selectAuthMethod,
    confirmHandover,
    downloadReceipt,
    shareReceipt,
    startNewHandover,
    dismissError,
  } = useDeliveryConfirm();

  useEffect(() => {
    // Start the scanning process automatically
    simulateQRScan();
  }, [simulateQRScan]);

  const renderScanningSection = () => (
    <View style={styles.section}>
      <QRScanner isScanning={isScanning} />
      <ScanStatus isVisible={true} status={scanStatus} />
    </View>
  );

  const renderHandoverDetails = () => (
    <View style={styles.section}>
      <SuccessAnimation isVisible={currentState === DELIVERY_STATES.SCANNED} />
      <ReceiverInfo 
        receiverData={receiverData || hookReceiverData || { name: 'Dr. Sarah Chen', department: 'Processing Lab', id: 'LAB-2024-SC' }} 
        isVisible={currentState === DELIVERY_STATES.SCANNED} 
      />
      <BatchInfo 
        batchData={batchData || hookBatchData || { batchId: 'BT-2024-0892', handoverTime: '14:32 PM', integrityStatus: 'verified' }} 
        isVisible={currentState === DELIVERY_STATES.SCANNED} 
      />
      <AuthenticationSection
        selectedMethod={selectedAuthMethod}
        onMethodSelect={selectAuthMethod}
        isVisible={currentState === DELIVERY_STATES.SCANNED || currentState === DELIVERY_STATES.AUTHENTICATING}
      />
      <ConfirmButton
        onPress={confirmHandover}
        isLoading={isLoading}
        isDisabled={!selectedAuthMethod}
        isVisible={currentState === DELIVERY_STATES.CONFIRMING || currentState === DELIVERY_STATES.AUTHENTICATING}
      />
    </View>
  );

  const renderSuccessScreen = () => (
    <SuccessScreen
      transactionData={transactionData}
      onDownload={downloadReceipt}
      onShare={shareReceipt}
      onNewHandover={() => {
        startNewHandover();
        // Navigate back to trips overview after completion
        setTimeout(() => {
          onDeliveryComplete && onDeliveryComplete();
        }, 2000);
      }}
      isVisible={currentState === DELIVERY_STATES.SUCCESS}
    />
  );

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
          {currentState === DELIVERY_STATES.SCANNING && renderScanningSection()}
          {(currentState === DELIVERY_STATES.SCANNED || 
            currentState === DELIVERY_STATES.AUTHENTICATING || 
            currentState === DELIVERY_STATES.CONFIRMING) && renderHandoverDetails()}
          {currentState === DELIVERY_STATES.SUCCESS && renderSuccessScreen()}
      </ScrollView>

      {/* Error Alert */}
      <ErrorAlert
        message={errorMessage}
        isVisible={showError}
        onDismiss={dismissError}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
});

export default DeliveryConfirmScreen;
