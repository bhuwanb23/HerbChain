/**
 * Smart Register — AI-assisted batch registration.
 *
 * Flow:
 *   1. Take a photo (or pick from gallery).
 *   2. Run the on-device TFLite plant model -> top-N {label, score}.
 *      If TFLite isn't available (Expo Go), fall through to step 3 with no
 *      candidates and a "pick from catalogue" view.
 *   3. POST the candidates to /api/v1/recognition/herbs -> top-3 AYUSH species.
 *   4. Farmer confirms a species.
 *   5. Fill in weight + harvest date + location, call POST /api/v1/batches.
 *   6. Show the new active QR (re-uses the QrTokenDisplay component).
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
  RecognitionAPI,
} from '../../../../services/apiClient';
import * as Tflite from '../../../../services/recognition/tflite';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SmartRegisterScreen({ navigation }) {
  const { accessToken } = useAuth();

  const [imageUri, setImageUri] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [topMatches, setTopMatches] = useState([]);     // backend rerank result
  const [pickedSpecies, setPickedSpecies] = useState(null);
  const [tfliteStatus, setTfliteStatus] = useState(Tflite.getStatus());
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [catalogue, setCatalogue] = useState([]);

  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
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
      const places = await Location.reverseGeocodeAsync(loc.coords);
      if (places && places[0]) {
        const p = places[0];
        setLocation(
          [p.name, p.city, p.region, p.country].filter(Boolean).join(', '),
        );
      }
    } catch (_e) {
      // ignore
    }
  }, []);

  const handleAfterImage = async (uri) => {
    setImageUri(uri);
    setRecognizing(true);
    setTopMatches([]);
    setPickedSpecies(null);
    try {
      // 1) on-device model (may be empty if TFLite isn't installed)
      let candidates = [];
      try {
        candidates = await Tflite.recognizeImage(uri, 5);
      } catch (_e) {
        candidates = [];
      }
      setTfliteStatus(Tflite.getStatus());

      // 2) If we got nothing, prompt the catalogue picker so the user can still
      //    drive the rerank with a single high-confidence label.
      if (!candidates || candidates.length === 0) {
        await loadCatalogue();
        setShowCataloguePicker(true);
        return;
      }

      // 3) Hand off to the backend rerank
      const out = await RecognitionAPI.rerank(accessToken, {
        candidates,
        top_k: 3,
      });
      setTopMatches(out.top || []);
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

  const onManualPick = async (species) => {
    setShowCataloguePicker(false);
    setRecognizing(true);
    try {
      const out = await RecognitionAPI.rerank(accessToken, {
        candidates: [{ label: species.common_name, score: 1.0 }],
        top_k: 3,
      });
      setTopMatches(out.top || []);
    } catch (err) {
      Alert.alert('Recognition failed', err?.message || 'Could not rerank');
    } finally {
      setRecognizing(false);
    }
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
    if (!pickedSpecies) {
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
    setSubmitting(true);
    try {
      const created = await BatchesAPI.create(accessToken, {
        species_name: pickedSpecies.common_name,
        // backend ignores unknown fields safely; we'd add species_id once schema accepts it
        harvest_date: harvestDate,
        location: location.trim(),
        weight_kg: Number(weight),
        image_url: imageUri || undefined,
        notes: notes.trim() || undefined,
      });
      setQrModal({
        batch_id: created.herb.batch_id,
        qr_token: created.qr_token,
        qr_png: created.qr_png,
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
            ? 'On-device classifier + AYUSH re-rank'
            : 'On-device model unavailable — falls back to catalogue pick + AYUSH re-rank'}
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
            keyExtractor={(it) => it.species_id}
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
                <QrTokenDisplay token={qrModal.qr_token} png={qrModal.qr_png} size={240} />
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
});
