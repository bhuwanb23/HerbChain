/**
 * Smart Register — AI-assisted batch registration.
 *
 * Flow:
 *   1. Take a photo (or pick from gallery) + capture GPS.
 *   2. Optional on-device TFLite model -> candidates (best effort).
 *   3. POST the image to /api/v1/identifications/detect -> top species predictions.
 *      Fallbacks: blurry image -> retake; AI down / no plant -> pick from catalogue.
 *   4. Farmer confirms a species (auto match or manual catalogue pick).
 *   5. Fill in weight + harvest date + cultivation + location, POST /api/v1/batches.
 *   6. Mint the QR via GET /api/v1/batches/:id/qr and show it (QrTokenDisplay).
 */
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { QrTokenDisplay } from '../../../../components';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  BatchesAPI,
  CatalogueAPI,
  IdentificationsAPI,
  UploadsAPI,
} from '../../../../services/apiClient';
import * as Tflite from '../../../../services/recognition/tflite';

const CULTIVATION_OPTIONS = [
  { value: 'organic', label: 'Organic' },
  { value: 'conventional', label: 'Conventional' },
  { value: 'wild_collection', label: 'Wild' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SmartRegisterScreen({ navigation }) {
  const { accessToken } = useAuth();

  const [imageUri, setImageUri] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [topMatches, setTopMatches] = useState([]);     // mapped detect predictions
  const [pickedSpecies, setPickedSpecies] = useState(null);
  const [identificationId, setIdentificationId] = useState(null);
  const [gps, setGps] = useState(null);                // { lat, lng, accuracy }
  const [tfliteStatus, setTfliteStatus] = useState(Tflite.getStatus());
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [catalogue, setCatalogue] = useState([]);

  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
  const [cultivationType, setCultivationType] = useState('organic');
  const [harvestDate, setHarvestDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qrModal, setQrModal] = useState(null);

  const ensurePermissions = async (which) => {
    const fn =
      which === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const res = await fn();
    return res.status === 'granted';
  };

  const captureLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setGps({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy || undefined,
      });
      const places = await Location.reverseGeocodeAsync(loc.coords);
      if (places && places[0]) {
        const p = places[0];
        setLocation(
          [p.name, p.city, p.region, p.country].filter(Boolean).join(', '),
        );
      }
    } catch (_e) {
      // ignore — register() retries GPS once before submitting
    }
  }, []);

  const handleAfterImage = async (uri) => {
    setImageUri(uri);
    setRecognizing(true);
    setTopMatches([]);
    setPickedSpecies(null);
    setIdentificationId(null);
    try {
      // 1) on-device model (best effort — may be empty if TFLite isn't installed)
      try {
        await Tflite.recognizeImage(uri, 5);
      } catch (_e) {
        // ignore — server detection is the source of truth
      }
      setTfliteStatus(Tflite.getStatus());

      // 2) server-side detection (multipart image -> mapped species predictions)
      let out;
      try {
        out = await IdentificationsAPI.detect(accessToken, {
          uri,
          name: 'plant.jpg',
          type: 'image/jpeg',
        });
      } catch (err) {
        if (err?.code === 'image_quality') {
          Alert.alert('Photo too blurry', 'Image quality is too low. Please retake the photo.');
          setImageUri(null);
          return;
        }
        // ai_unavailable / network — degrade to manual catalogue pick
        if (err?.code !== 'ai_unavailable') {
          Alert.alert('Recognition failed', err?.message || 'Could not run AI');
        } else {
          Alert.alert('AI unavailable', 'Recognition is temporarily unavailable — pick from the catalogue.');
        }
        await loadCatalogue();
        setShowCataloguePicker(true);
        return;
      }

      if (out?.status === 'no_plant') {
        Alert.alert('No plant detected', 'We could not detect a plant. Pick from the catalogue instead.');
        await loadCatalogue();
        setShowCataloguePicker(true);
        return;
      }

      setIdentificationId(out?.identification?.id || null);
      const mapped = (out?.identification?.predictions || [])
        .filter((p) => p.mapped && p.species_id)
        .slice(0, 3)
        .map((p) => ({
          species_id: p.species_id,
          common_name: p.common_name || p.label,
          scientific_name: p.scientific_name || '',
          confidence: p.confidence ?? 0,
        }));
      if (mapped.length === 0) {
        await loadCatalogue();
        setShowCataloguePicker(true);
        return;
      }
      setTopMatches(mapped);
    } catch (err) {
      Alert.alert('Recognition failed', err?.message || 'Could not run AI');
    } finally {
      setRecognizing(false);
    }
  };

  const loadCatalogue = async () => {
    try {
      const data = await CatalogueAPI.list(accessToken);
      setCatalogue(data.species || []);
    } catch (err) {
      Alert.alert('Could not load catalogue', err?.message || 'Network error');
    }
  };

  const onManualPick = (species) => {
    setShowCataloguePicker(false);
    setPickedSpecies({
      species_id: species.id,
      common_name: species.common_name,
      scientific_name: species.scientific_name,
      confidence: 1,
    });
  };

  const pickCamera = async () => {
    if (!(await ensurePermissions('camera'))) {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      captureLocation();
      handleAfterImage(res.assets[0].uri);
    }
  };

  const pickLibrary = async () => {
    if (!(await ensurePermissions('library'))) {
      Alert.alert('Permission required', 'Photo library permission is needed.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      captureLocation();
      handleAfterImage(res.assets[0].uri);
    }
  };

  const register = async () => {
    if (!pickedSpecies?.species_id) {
      Alert.alert('Pick a species', 'Confirm which AYUSH species this is.');
      return;
    }
    if (!weight || Number(weight) <= 0) {
      Alert.alert('Weight', 'Enter a positive weight in kg.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Location', 'Enter your harvest location.');
      return;
    }

    // GPS is required by the server — retry once if the initial capture failed.
    let fix = gps;
    if (!fix) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          fix = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: loc.coords.accuracy || undefined,
          };
        }
      } catch (_e) {
        fix = null;
      }
    }
    if (!fix) {
      Alert.alert('Location', 'GPS location is required to register a batch.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        species_id: pickedSpecies.species_id,
        quantity: Number(weight),
        unit: 'kg',
        harvest_date: harvestDate,
        cultivation_type: cultivationType,
        gps_lat: fix.lat,
        gps_lng: fix.lng,
        location: location.trim(),
        ...(fix.accuracy ? { gps_accuracy: fix.accuracy } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      if (identificationId) {
        // the detection's asset satisfies the "at least one image" rule
        payload.identification_id = identificationId;
      } else if (imageUri) {
        const up = await UploadsAPI.image(accessToken, {
          uri: imageUri,
          name: 'harvest.jpg',
          type: 'image/jpeg',
        });
        if (up?.asset?.id) payload.asset_ids = [up.asset.id];
      } else {
        Alert.alert('Image required', 'Take a photo before registering.');
        return;
      }

      const created = await BatchesAPI.create(accessToken, payload);
      const batch = created.batch || {};
      let card = null;
      try {
        card = await BatchesAPI.getQr(accessToken, batch.id);
      } catch (_e) {
        card = null;
      }
      const qr = card?.qr;
      setQrModal({
        batch_id: batch.code || batch.id,
        qr_token: qr?.url || qr?.token_prefix || '',
        qr_png: qr?.png || null,
        message: qr ? null : card?.message || 'QR not yet available for this batch.',
      });
    } catch (err) {
      Alert.alert('Registration failed', err?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Smart Register (AI)</Text>
        <Text style={styles.subtitle}>
          {tfliteStatus.available
            ? 'On-device model + server AI detection'
            : 'Server AI detection — catalogue pick fallback available'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!imageUri && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primary} onPress={pickCamera}>
              <Text style={styles.primaryText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondary} onPress={pickLibrary}>
              <Text style={styles.secondaryText}>From gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            {recognizing && (
              <View style={styles.center}>
                <ActivityIndicator color="#10B981" />
                <Text style={styles.muted}>Analyzing…</Text>
              </View>
            )}

            {!recognizing && topMatches.length > 0 && (
              <>
                <Text style={styles.section}>Top AYUSH matches</Text>
                {topMatches.map((m) => {
                  const active = pickedSpecies?.species_id === m.species_id;
                  return (
                    <TouchableOpacity
                      key={m.species_id}
                      style={[styles.match, active && styles.matchActive]}
                      onPress={() => setPickedSpecies(m)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.matchName, active && { color: '#FFF' }]}>
                          {m.common_name}
                        </Text>
                        <Text style={[styles.matchSci, active && { color: '#E0F2FE' }]}>
                          {m.scientific_name}
                        </Text>
                        <Text style={[styles.matchSci, active && { color: '#E0F2FE' }]}>
                          confidence: {(m.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => {
                    loadCatalogue();
                    setShowCataloguePicker(true);
                  }}
                >
                  <Text style={styles.link}>None of these — pick from catalogue</Text>
                </TouchableOpacity>
              </>
            )}

            {!recognizing && pickedSpecies && (
              <>
                <Text style={styles.section}>Batch details</Text>

                <Text style={styles.label}>Weight (kg) *</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                  placeholder="0.0"
                />

                <Text style={styles.label}>Harvest date</Text>
                <TextInput
                  value={harvestDate}
                  onChangeText={setHarvestDate}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Cultivation type *</Text>
                <View style={styles.segRow}>
                  {CULTIVATION_OPTIONS.map((opt) => {
                    const active = cultivationType === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.seg, active && styles.segActive]}
                        onPress={() => setCultivationType(opt.value)}
                      >
                        <Text style={[styles.segText, active && styles.segTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Location *</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  placeholder="Village / district / state"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  style={[styles.input, { minHeight: 70 }]}
                  multiline
                  placeholderTextColor="#9CA3AF"
                />

                <TouchableOpacity
                  style={[styles.primary, submitting && { opacity: 0.7 }]}
                  onPress={register}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryText}>Register & mint QR</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Catalogue picker modal (fallback / "none of these") */}
      <Modal
        visible={showCataloguePicker}
        animationType="slide"
        onRequestClose={() => setShowCataloguePicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <View style={styles.header}>
            <Text style={styles.title}>Pick a species</Text>
            <Text style={styles.subtitle}>Search the AYUSH catalogue</Text>
          </View>
          <FlatList
            data={catalogue}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onManualPick(item)}>
                <Text style={styles.rowName}>{item.common_name}</Text>
                <Text style={styles.rowSci}>{item.scientific_name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={() => setShowCataloguePicker(false)}>
            <Text style={{ textAlign: 'center', color: '#6B7280', paddingVertical: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* QR display modal */}
      <Modal
        visible={Boolean(qrModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModal(null)}
      >
        <View style={styles.qrBackdrop}>
          <View style={styles.qrCard}>
            {qrModal && (
              <>
                <Text style={styles.qrTitle}>Active QR</Text>
                <Text style={styles.qrSubtitle}>{qrModal.batch_id}</Text>
                {qrModal.message && !qrModal.qr_png && !qrModal.qr_token ? (
                  <Text style={styles.qrMessage}>{qrModal.message}</Text>
                ) : (
                  <QrTokenDisplay token={qrModal.qr_token} png={qrModal.qr_png} size={240} />
                )}
                <TouchableOpacity
                  style={styles.primary}
                  onPress={() => {
                    setQrModal(null);
                    navigation?.goBack?.();
                  }}
                >
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#065F46' },
  subtitle: { color: '#6B7280', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  primary: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#FFF', fontWeight: '700' },
  secondary: {
    flex: 1,
    borderColor: '#10B981',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryText: { color: '#10B981', fontWeight: '700' },
  preview: { width: '100%', height: 240, borderRadius: 12, marginBottom: 12 },
  section: { fontWeight: '700', color: '#065F46', marginTop: 16, marginBottom: 8 },
  match: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  matchActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  matchName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  matchSci: { color: '#6B7280', fontSize: 12 },
  label: { fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  segRow: { flexDirection: 'row', marginBottom: 4 },
  seg: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFF',
  },
  segActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  segText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  segTextActive: { color: '#FFF' },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  linkBtn: { marginTop: 6, alignSelf: 'center' },
  link: { color: '#10B981', textDecorationLine: 'underline', fontSize: 12 },
  center: { padding: 24, alignItems: 'center' },
  muted: { color: '#6B7280', marginTop: 8 },
  row: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowName: { color: '#111827', fontWeight: '700' },
  rowSci: { color: '#6B7280', fontStyle: 'italic', fontSize: 12 },
  qrBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxWidth: 360, width: '100%' },
  qrTitle: { fontSize: 20, fontWeight: '700', color: '#065F46', textAlign: 'center' },
  qrSubtitle: { color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  qrMessage: { color: '#6B7280', textAlign: 'center', marginBottom: 12, fontSize: 13 },
});
