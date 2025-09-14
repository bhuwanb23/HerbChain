import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const DeliveryConfirmScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    currentState,
    isScanning,
    scanStatus,
    selectedAuthMethod,
    isLoading,
    showError,
    errorMessage,
    receiverData,
    batchData,
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
        receiverData={receiverData} 
        isVisible={currentState === DELIVERY_STATES.SCANNED} 
      />
      <BatchInfo 
        batchData={batchData} 
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
      onNewHandover={startNewHandover}
      isVisible={currentState === DELIVERY_STATES.SUCCESS}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="arrow-back" size={24} color="#374151" />
            <Text style={styles.headerTitle}>Handover Confirmation</Text>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Content */}
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
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 32,
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
