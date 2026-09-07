/**
 * LabSampleCreate — create a sample for a batch.
 * Backend: POST /api/v1/labs/samples { batch_id, sample_type }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const SAMPLE_TYPES = ['herb_sample', 'root_sample', 'leaf_sample', 'flower_sample', 'extract_sample'];

export default function LabSampleCreate({ route, navigation }) {
  const { accessToken } = useAuth();
  const batchId = route?.params?.batchId;
  const [sampleType, setSampleType] = useState('herb_sample');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await LabsAPI.createSample(accessToken, { batch_id: batchId, sample_type: sampleType, notes: notes.trim() || undefined });
      Alert.alert('Sample Created', 'Sample registered successfully.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create sample');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Sample</Text>
      <Text style={styles.subtitle}>Batch: {batchId}</Text>

      <Text style={styles.label}>Sample Type *</Text>
      <View style={styles.chipRow}>
        {SAMPLE_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, sampleType === t && styles.chipActive]}
            onPress={() => setSampleType(t)}
          >
            <Text style={[styles.chipText, sampleType === t && styles.chipTextActive]}>{t.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={[styles.input, { minHeight: 80 }]} value={notes} onChangeText={setNotes} multiline placeholder="Collection notes..." />

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Create Sample</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
