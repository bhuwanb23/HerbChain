/**
 * PickupCapture — transporter records pickup at origin.
 *
 * Flow: scan batch QR → capture photo (optional) → GPS auto-capture →
 *       submit → POST /shipments/:id/pickup
 *
 * Backend: POST /api/v1/shipments/:id/pickup { token, gps_lat, gps_lng, photo_asset_id }
 */
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ShipmentsAPI, UploadsAPI } from '../../../services/apiClient';

export default function PickupCapture({ route, navigation }) {
  const { accessToken } = useAuth();
  const shipmentId = route?.params?.shipmentId;
  const [qrToken, setQrToken] = useState('');
  const [remarks, setRemarks] = useState('');
  const [gps, setGps] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const captureGps = useCallback(() => {
    setGpsLoading(true);
    // In a real app: expo-location getCurrentPositionAsync()
    // For now, use a mock or geolocation API
    try {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsLoading(false);
          },
          () => {
            setGps({ lat: 0, lng: 0 });
            setGpsLoading(false);
          },
        );
      } else {
        setGps({ lat: 0, lng: 0 });
        setGpsLoading(false);
      }
    } catch {
      setGps({ lat: 0, lng: 0 });
      setGpsLoading(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!qrToken.trim()) {
      Alert.alert('Required', 'Please scan or enter the batch QR token');
      return;
    }
    setSubmitting(true);
    try {
      let photoAssetId = null;
      if (photo) {
        const uploaded = await UploadsAPI.image(accessToken, photo);
        photoAssetId = uploaded?.asset?.id || uploaded?.id;
      }

      await ShipmentsAPI.pickup(accessToken, shipmentId, {
        token: qrToken.trim(),
        gps_lat: gps?.lat || 0,
        gps_lng: gps?.lng || 0,
        photo_asset_id: photoAssetId,
        remarks: remarks.trim() || undefined,
      });

      Alert.alert('Pickup Recorded', 'Shipment picked up successfully. You are now in transit.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Pickup Failed', err.message || 'Could not record pickup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Pickup</Text>
        <Text style={styles.subtitle}>Scan the batch QR and confirm pickup</Text>
      </View>

      <View style={styles.form}>
        {/* QR Token */}
        <View style={styles.field}>
          <Text style={styles.label}>Batch QR Token *</Text>
          <TextInput
            style={styles.input}
            value={qrToken}
            onChangeText={setQrToken}
            placeholder="Scan or paste QR token"
            autoCapitalize="none"
          />
        </View>

        {/* GPS */}
        <View style={styles.field}>
          <Text style={styles.label}>GPS Location</Text>
          <TouchableOpacity style={styles.gpsBtn} onPress={captureGps} disabled={gpsLoading}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#0EA5E9" />
            ) : gps ? (
              <Text style={styles.gpsText}>📍 {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</Text>
            ) : (
              <Text style={styles.gpsBtnText}>Capture GPS Location</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Photo placeholder */}
        <View style={styles.field}>
          <Text style={styles.label}>Pickup Photo (optional)</Text>
          <TouchableOpacity style={styles.photoBtn} onPress={() => Alert.alert('Camera', 'Camera integration coming in A6')}>
            <Text style={styles.photoBtnText}>📷 Take Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Remarks */}
        <View style={styles.field}>
          <Text style={styles.label}>Remarks (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Any notes about this pickup..."
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Confirm Pickup</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  form: { flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  gpsBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  gpsBtnText: { color: '#0EA5E9', fontWeight: '600', fontSize: 14 },
  gpsText: { color: '#111827', fontWeight: '500', fontSize: 14 },
  photoBtn: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  photoBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  submitBtn: {
    backgroundColor: '#0EA5E9', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 20,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
