import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

export const ScannerOverlay = ({ visible, onClose, onScanned }) => {
  const { t } = useGlobalTranslation();
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <CameraView
        style={{ flex: 1, width: '100%' }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => onScanned && onScanned(data)}
      />
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>{t.transporterTrips?.close || 'Close'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});


