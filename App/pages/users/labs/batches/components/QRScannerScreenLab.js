import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const qrCodeAreaSize = width * 0.7; // 70% of screen width

const QRScannerScreenLab = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return; // Prevent multiple scans
    setScanned(true);
    Alert.alert(
      'QR Code Scanned',
      `Data: ${data}`,
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('LabBatchesPage', { scannedData: data, batchId: route.params?.batchId }); // Navigate back to LabBatchesPage
          }
        }
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting for camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.qrCodeArea} />
        <Text style={styles.scanText}>Scan the QR Code</Text>
        {scanned && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
            <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  permissionText: {
    fontSize: 18,
    color: '#4b5563',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qrCodeArea: {
    width: qrCodeAreaSize,
    height: qrCodeAreaSize,
    borderWidth: 2,
    borderColor: '#22c55e', // Lab green color
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scanText: {
    marginTop: 20,
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanAgainButton: {
    marginTop: 30,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreenLab;