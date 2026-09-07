/**
 * LabTestCreate — create a test for a sample.
 * Backend: POST /api/v1/labs/tests { sample_id, test_category }
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const TEST_CATEGORIES = [
  'moisture', 'purity', 'heavy_metals', 'microbial', 'pesticide',
  'identity', 'foreign_matter', 'ash_content', 'volatile_oil',
];

export default function LabTestCreate({ route, navigation }) {
  const { accessToken } = useAuth();
  const { batchId, samples } = route?.params || {};
  const [selectedSample, setSelectedSample] = useState(samples?.[0]?.id || null);
  const [testCategory, setTestCategory] = useState('moisture');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSample) {
      Alert.alert('Required', 'Select a sample first');
      return;
    }
    setSubmitting(true);
    try {
      await LabsAPI.createTest(accessToken, { sample_id: selectedSample, test_category: testCategory });
      Alert.alert('Test Created', 'Test registered successfully.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Test</Text>

      {samples && samples.length > 0 && (
        <>
          <Text style={styles.label}>Sample *</Text>
          <View style={styles.chipRow}>
            {samples.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selectedSample === s.id && styles.chipActive]}
                onPress={() => setSelectedSample(s.id)}
              >
                <Text style={[styles.chipText, selectedSample === s.id && styles.chipTextActive]}>
                  {s.sample_code || s.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Test Category *</Text>
      <View style={styles.chipRow}>
        {TEST_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, testCategory === c && styles.chipActive]}
            onPress={() => setTestCategory(c)}
          >
            <Text style={[styles.chipText, testCategory === c && styles.chipTextActive]}>{c.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Create Test</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  submitBtn: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
