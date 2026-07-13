/**
 * Farm profile screen — view and edit the farmer's land/soil/cert info.
 *
 * Backed by GET/PUT /api/v1/farm/me.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../../../contexts/AuthContext';
import { FarmProfileAPI } from '../../../../services/apiClient';

const SOIL = ['alluvial', 'black', 'red', 'laterite', 'sandy', 'loamy', 'clay', 'saline', 'other'];
const IRRIG = ['rainfed', 'drip', 'sprinkler', 'flood', 'borewell', 'canal', 'mixed', 'other'];
const CERTIFICATIONS = ['organic', 'good_agri_practices', 'gap', 'fairtrade', 'pgs_india'];

function Pill({ active, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function FarmProfileScreen({ navigation }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [farmName, setFarmName] = useState('');
  const [landSize, setLandSize] = useState('');
  const [soilType, setSoilType] = useState(null);
  const [irrigationType, setIrrigationType] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await FarmProfileAPI.getMine(accessToken);
      const f = data.farm;
      if (f) {
        setFarmName(f.farm_name || '');
        setLandSize(f.land_size_acres ? String(f.land_size_acres) : '');
        setSoilType(f.soil_type || null);
        setIrrigationType(f.irrigation_type || null);
        setCertifications(f.certifications || []);
        setAddress(f.address || '');
        setLat(f.gps_lat != null ? String(f.gps_lat) : '');
        setLng(f.gps_lng != null ? String(f.gps_lng) : '');
        setNotes(f.notes || '');
      }
    } catch (err) {
      Alert.alert('Could not load farm profile', err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCert = (cert) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        farm_name: farmName.trim() || null,
        land_size_acres: landSize ? Number(landSize) : null,
        soil_type: soilType,
        irrigation_type: irrigationType,
        certifications,
        address: address.trim() || null,
        gps_lat: lat ? Number(lat) : null,
        gps_lng: lng ? Number(lng) : null,
        notes: notes.trim() || null,
      };
      await FarmProfileAPI.upsertMine(accessToken, payload);
      Alert.alert('Saved', 'Farm profile updated.');
    } catch (err) {
      Alert.alert('Could not save', err?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Farm Profile & Land Records</Text>
      <Text style={styles.subtitle}>Used by weather, crop calendar, and regulator reports.</Text>

      <Text style={styles.label}>Farm name</Text>
      <TextInput value={farmName} onChangeText={setFarmName} style={styles.input} placeholder="e.g. Green Valley" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Land size (acres)</Text>
      <TextInput value={landSize} onChangeText={setLandSize} style={styles.input} keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Soil type</Text>
      <View style={styles.pillRow}>
        {SOIL.map((s) => (
          <Pill key={s} active={soilType === s} label={s} onPress={() => setSoilType(s === soilType ? null : s)} />
        ))}
      </View>

      <Text style={styles.label}>Irrigation</Text>
      <View style={styles.pillRow}>
        {IRRIG.map((s) => (
          <Pill key={s} active={irrigationType === s} label={s} onPress={() => setIrrigationType(s === irrigationType ? null : s)} />
        ))}
      </View>

      <Text style={styles.label}>Certifications</Text>
      <View style={styles.pillRow}>
        {CERTIFICATIONS.map((c) => (
          <Pill key={c} active={certifications.includes(c)} label={c.replace(/_/g, ' ')} onPress={() => toggleCert(c)} />
        ))}
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="Village / district / state" placeholderTextColor="#9CA3AF" />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput value={lat} onChangeText={setLat} style={styles.input} keyboardType="numbers-and-punctuation" placeholderTextColor="#9CA3AF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput value={lng} onChangeText={setLng} style={styles.input} keyboardType="numbers-and-punctuation" placeholderTextColor="#9CA3AF" />
        </View>
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} style={[styles.input, { minHeight: 90 }]} multiline placeholder="Optional" placeholderTextColor="#9CA3AF" />

      <TouchableOpacity onPress={save} disabled={saving} style={[styles.primary, saving && { opacity: 0.7 }]}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Save profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  back: { marginBottom: 4 },
  backText: { color: '#10B981', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#065F46', marginTop: 6 },
  subtitle: { color: '#6B7280', marginBottom: 16 },
  label: { fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#111827',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E5E7EB' },
  pillActive: { backgroundColor: '#10B981' },
  pillText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  pillTextActive: { color: '#FFF' },
  primary: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
