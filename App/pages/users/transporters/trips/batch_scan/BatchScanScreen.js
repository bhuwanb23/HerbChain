import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  ScannerWindow,
  ScannerControls,
  BatchDetails,
  InvalidBatch,
  ActionButtons,
} from './components';
import { useBatchScan } from './hooks';

const BatchScanScreen = () => {
  const insets = useSafeAreaInsets();
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
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Batch Scanner</Text>
          
          <TouchableOpacity style={styles.historyButton}>
            <Icon name="history" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

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
            onAcceptBatch={handleAcceptBatch}
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
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  historyButton: {
    padding: 8,
    marginRight: -8,
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
