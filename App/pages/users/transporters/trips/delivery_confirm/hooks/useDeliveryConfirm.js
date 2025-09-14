import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  DELIVERY_STATES, 
  AUTH_METHODS, 
  DEMO_RECEIVER_DATA, 
  DEMO_BATCH_DATA, 
  DEMO_TRANSACTION_DATA,
  ERROR_MESSAGES,
  ANIMATION_DURATIONS 
} from '../constants';

export const useDeliveryConfirm = () => {
  const [currentState, setCurrentState] = useState(DELIVERY_STATES.SCANNING);
  const [isScanning, setIsScanning] = useState(true);
  const [scanStatus, setScanStatus] = useState('scanning');
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const startScanning = useCallback(() => {
    setCurrentState(DELIVERY_STATES.SCANNING);
    setIsScanning(true);
    setScanStatus('scanning');
    setSelectedAuthMethod(null);
    setIsLoading(false);
    setShowError(false);
  }, []);

  const simulateQRScan = useCallback(() => {
    // Simulate QR code detection
    setTimeout(() => {
      setScanStatus('success');
      setIsScanning(false);
      
      setTimeout(() => {
        setCurrentState(DELIVERY_STATES.SCANNED);
      }, ANIMATION_DURATIONS.STATUS_DISPLAY);
    }, ANIMATION_DURATIONS.SCAN_DURATION);
  }, []);

  const selectAuthMethod = useCallback((method) => {
    setSelectedAuthMethod(method);
    setCurrentState(DELIVERY_STATES.AUTHENTICATING);
    
    // Simulate authentication process
    setTimeout(() => {
      if (method === AUTH_METHODS.FINGERPRINT) {
        // Simulate successful fingerprint authentication
        setCurrentState(DELIVERY_STATES.CONFIRMING);
      } else {
        // Simulate signature authentication
        setCurrentState(DELIVERY_STATES.CONFIRMING);
      }
    }, 1500);
  }, []);

  const confirmHandover = useCallback(() => {
    if (!selectedAuthMethod) {
      setErrorMessage(ERROR_MESSAGES.AUTH_FAILED);
      setShowError(true);
      return;
    }

    setIsLoading(true);
    setCurrentState(DELIVERY_STATES.CONFIRMING);

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
      setCurrentState(DELIVERY_STATES.SUCCESS);
    }, ANIMATION_DURATIONS.PROCESSING);
  }, [selectedAuthMethod]);

  const downloadReceipt = useCallback(() => {
    Alert.alert('Download', 'Receipt downloaded successfully!');
  }, []);

  const shareReceipt = useCallback(() => {
    Alert.alert('Share', 'Receipt shared successfully!');
  }, []);

  const startNewHandover = useCallback(() => {
    startScanning();
    simulateQRScan();
  }, [startScanning, simulateQRScan]);

  const dismissError = useCallback(() => {
    setShowError(false);
    setErrorMessage('');
  }, []);

  const resetToScanning = useCallback(() => {
    startScanning();
  }, [startScanning]);

  return {
    // State
    currentState,
    isScanning,
    scanStatus,
    selectedAuthMethod,
    isLoading,
    showError,
    errorMessage,
    
    // Data
    receiverData: DEMO_RECEIVER_DATA,
    batchData: DEMO_BATCH_DATA,
    transactionData: DEMO_TRANSACTION_DATA,
    
    // Actions
    startScanning,
    simulateQRScan,
    selectAuthMethod,
    confirmHandover,
    downloadReceipt,
    shareReceipt,
    startNewHandover,
    dismissError,
    resetToScanning,
  };
};
