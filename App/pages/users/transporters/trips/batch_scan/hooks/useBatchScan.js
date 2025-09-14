import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { SCANNER_STATES, BATCH_STATUS, DEMO_BATCH_DATA, ERROR_MESSAGES } from '../constants';

export const useBatchScan = () => {
  const [scannerState, setScannerState] = useState(SCANNER_STATES.IDLE);
  const [batchData, setBatchData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [showInvalidBatch, setShowInvalidBatch] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setScannerState(SCANNER_STATES.SCANNING);
    setShowBatchDetails(false);
    setShowInvalidBatch(false);
    setShowActionButtons(false);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setScannerState(SCANNER_STATES.IDLE);
  }, []);

  const handleScanSuccess = useCallback((scannedData = DEMO_BATCH_DATA) => {
    setBatchData(scannedData);
    setScannerState(SCANNER_STATES.SUCCESS);
    setIsScanning(false);
    setShowBatchDetails(true);
    setShowActionButtons(true);
    setShowInvalidBatch(false);
  }, []);

  const handleScanError = useCallback((errorMessage = ERROR_MESSAGES.INVALID_BATCH) => {
    setScannerState(SCANNER_STATES.ERROR);
    setIsScanning(false);
    setShowInvalidBatch(true);
    setShowBatchDetails(false);
    setShowActionButtons(false);
  }, []);

  const handleManualEntry = useCallback((code) => {
    if (code && code.trim()) {
      // Simulate successful scan with manual entry
      const manualBatchData = {
        ...DEMO_BATCH_DATA,
        batchId: code.trim(),
        timestamp: new Date().toLocaleString(),
      };
      handleScanSuccess(manualBatchData);
    }
  }, [handleScanSuccess]);

  const handleFlashlightToggle = useCallback((isOn) => {
    setFlashlightOn(isOn);
    // Here you would integrate with actual flashlight API
  }, []);

  const handleAcceptBatch = useCallback(() => {
    Alert.alert(
      'Batch Accepted',
      'Batch has been successfully accepted and added to your trip.',
      [{ text: 'OK', onPress: () => resetScanner() }]
    );
  }, []);

  const handleHandoverBatch = useCallback(() => {
    Alert.alert(
      'Batch Handover',
      'Batch has been handed over to the next transporter.',
      [{ text: 'OK', onPress: () => resetScanner() }]
    );
  }, []);

  const resetScanner = useCallback(() => {
    setScannerState(SCANNER_STATES.IDLE);
    setIsScanning(false);
    setBatchData(null);
    setShowBatchDetails(false);
    setShowInvalidBatch(false);
    setShowActionButtons(false);
  }, []);

  const demoSuccessScan = useCallback(() => {
    handleScanSuccess();
  }, [handleScanSuccess]);

  const demoInvalidScan = useCallback(() => {
    handleScanError();
  }, [handleScanError]);

  return {
    // State
    scannerState,
    batchData,
    isScanning,
    flashlightOn,
    showBatchDetails,
    showInvalidBatch,
    showActionButtons,
    
    // Actions
    startScanning,
    stopScanning,
    handleScanSuccess,
    handleScanError,
    handleManualEntry,
    handleFlashlightToggle,
    handleAcceptBatch,
    handleHandoverBatch,
    resetScanner,
    demoSuccessScan,
    demoInvalidScan,
  };
};
