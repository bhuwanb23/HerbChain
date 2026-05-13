/**
 * Reusable QR scan bottom-sheet style screen.
 *
 *  - Uses `expo-camera` CameraView for a live camera scan.
 *  - Always shows a "Paste token manually" textarea so the flow works in dev
 *    environments where the camera is unavailable (Expo Web, simulators).
 *  - Calls `onScanned(token)` with the raw decoded text. Caller is responsible
 *    for verifying / dispatching that token to the backend.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// `expo-camera` is the recommended scanner for SDK 50+. Older Expo dev clients
// may still have `expo-barcode-scanner` — we fall back to it if Camera is
// unavailable.
let CameraView = null;
let useCameraPermissions = null;
try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (_e) {
  CameraView = null;
}

export default function ScanQrSheet({
  title = 'Scan QR',
  helperText = 'Point at the QR code on the package or paste the token below.',
  onScanned,
  onCancel,
  busy = false,
}) {
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, () => Promise.resolve({ granted: false })];

  const [manualToken, setManualToken] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (CameraView && useCameraPermissions && !permission?.granted && !permission?.canAskAgain) {
      // Already denied — do nothing
    } else if (CameraView && useCameraPermissions && !permission?.granted) {
      requestPermission().catch(() => {});
    }
  }, []);

  const triggerScan = (rawValue) => {
    if (hasScanned || busy) return;
    const value = (rawValue || '').trim();
    if (!value) {
      Alert.alert('Empty token', 'Paste or scan a valid QR token.');
      return;
    }
    setHasScanned(true);
    onScanned && onScanned(value);
  };

  const cameraAvailable = !!CameraView && Platform.OS !== 'web' && permission?.granted;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onCancel} disabled={busy}>
          <Text style={styles.cancel}>{busy ? 'Working…' : 'Cancel'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helper}>{helperText}</Text>

      {cameraAvailable ? (
        <View style={styles.cameraBox}>
          <CameraView
            style={styles.camera}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={hasScanned ? undefined : (result) => triggerScan(result.data)}
          />
          {!cameraReady ? (
            <View style={styles.cameraOverlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
          <View style={styles.scanFrame} />
        </View>
      ) : (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>
            {CameraView
              ? 'Camera permission denied — use the manual paste field below.'
              : 'Camera not available on this platform. Paste the token instead.'}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Paste token (or scan above)</Text>
      <TextInput
        value={manualToken}
        onChangeText={setManualToken}
        placeholder="eyJhbGciOiJI…"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      <TouchableOpacity
        style={[styles.submit, busy && styles.submitBusy]}
        onPress={() => triggerScan(manualToken)}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit token</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#065F46' },
  cancel: { color: '#10B981', fontWeight: '600' },
  helper: { color: '#374151', fontSize: 13, marginBottom: 12 },
  cameraBox: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
  },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    position: 'absolute',
    top: '20%',
    left: '20%',
    right: '20%',
    bottom: '20%',
    borderColor: '#10B981',
    borderWidth: 3,
    borderRadius: 12,
  },
  cameraFallback: {
    backgroundColor: '#F3F4F6',
    padding: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  cameraFallbackText: { color: '#374151', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    color: '#111827',
    textAlignVertical: 'top',
  },
  submit: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBusy: { opacity: 0.7 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
