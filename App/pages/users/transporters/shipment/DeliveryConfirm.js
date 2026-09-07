/**
 * DeliveryConfirm — transporter records delivery at destination.
 *
 * Flow: scan batch QR → GPS auto-capture → capture POD photo →
 *       submit → POST /shipments/:id/deliver + /shipments/:id/pod
 *
 * Backend: POST /api/v1/shipments/:id/deliver { token, gps_lat, gps_lng, photo_asset_id }
 *          POST /api/v1/shipments/:id/pod    { pod_type, asset_id, remarks }
 */
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { ShipmentsAPI, UploadsAPI } from '../../../services/apiClient';

export default function DeliveryConfirm({ route, navigation }) {
  const { accessToken } = useAuth();
  const shipmentId = route?.params?.shipmentId;
  const [qrToken, setQrToken] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [gps, setGps] = useState(null);
  const [podPhoto, setPodPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const captureGps = useCallback(() => {
    setGpsLoading(true);
    try {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGpsLoading(false);
          },
          () => { setGps({ lat: 0, lng: 0 }); setGpsLoading(false); },
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
    if (!receiverName.trim()) {
      Alert.alert('Required', 'Please enter the receiver name');
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: deliver the shipment
      await ShipmentsAPI.deliver(accessToken, shipmentId, {
        token: qrToken.trim(),
        gps_lat: gps?.lat || 0,
        gps_lng: gps?.lng || 0,
      });

      // Step 2: attach POD if photo was taken
      if (podPhoto) {
        const uploaded = await UploadsAPI.image(accessToken, podPhoto);
        const assetId = uploaded?.asset?.id || uploaded?.id;
        if (assetId) {
          await ShipmentsAPI.pod(accessToken, shipmentId, {
            pod_type: 'photo',
            asset_id: assetId,
            remarks: `Delivered to ${receiverName}${remarks ? '. ' + remarks : ''}`,
          });
        }
      }

      Alert.alert('Delivery Confirmed', 'Shipment delivered successfully!', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Delivery Failed', err.message || 'Could not confirm delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Delivery</Text>
        <Text style={styles.subtitle}>Scan QR, capture proof of delivery</Text>
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

        {/* Receiver Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Received By *</Text>
          <TextInput
            style={styles.input}
            value={receiverName}
            onChangeText={setReceiverName}
            placeholder="Name of person receiving"
          />
        </View>

        {/* GPS */}
        <View style={styles.field}>
          <Text style={styles.label}>Delivery GPS</Text>
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

        {/* POD Photo */}
        <View style={styles.field}>
          <Text style={styles.label}>Proof of Delivery Photo (optional)</Text>
          <TouchableOpacity style={styles.photoBtn} onPress={() => Alert.alert('Camera', 'Camera integration coming in A6')}>
            <Text style={styles.photoBtnText}>📷 Take POD Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Remarks */}
        <View style={styles.field}>
          <Text style={styles.label}>Remarks (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Delivery notes..."
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
          <Text style={styles.submitText}>Confirm Delivery</Text>
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
    backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 20,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
