/**
 * LabTestEntry — enter test results and submit for review.
 *
 * Backend: GET /api/v1/labs/tests/:testId, POST /api/v1/labs/tests/:testId/results,
 *          POST /api/v1/labs/tests/:testId/submit, POST /api/v1/labs/reviews
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { LabsAPI } from '../../../services/apiClient';

const COMMON_PARAMS = [
  { code: 'moisture', label: 'Moisture Content (%)', ref: '≤ 12.0' },
  { code: 'purity', label: 'Purity (%)', ref: '≥ 95.0' },
  { code: 'ash_content', label: 'Ash Content (%)', ref: '≤ 8.0' },
  { code: 'heavy_metals', label: 'Heavy Metals (ppm)', ref: '≤ 10.0' },
  { code: 'pesticide_residue', label: 'Pesticide Residue (ppm)', ref: '≤ 0.1' },
  { code: 'microbial_count', label: 'Microbial Count (CFU/g)', ref: '≤ 10000' },
  { code: 'foreign_matter', label: 'Foreign Matter (%)', ref: '≤ 2.0' },
  { code: 'volatile_oil', label: 'Volatile Oil (%)', ref: '≥ 0.5' },
];

export default function LabTestEntry({ route, navigation }) {
  const { accessToken } = useAuth();
  const testId = route?.params?.testId;
  const [test, setTest] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!testId || !accessToken) return;
    try {
      setLoading(true);
      const data = await LabsAPI.getTest(accessToken, testId);
      setTest(data?.test || data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [testId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleResultChange = (code, value) => {
    setResults((prev) => ({ ...prev, [code]: value }));
  };

  const handleSubmitResults = async () => {
    setSubmitting(true);
    try {
      for (const [code, value] of Object.entries(results)) {
        if (value.trim()) {
          await LabsAPI.saveResults(accessToken, testId, {
            parameter_code: code,
            observed_value: parseFloat(value) || value,
          });
        }
      }
      await LabsAPI.submitTest(accessToken, testId);
      Alert.alert('Results Submitted', 'Test submitted for supervisor review.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit results');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Test Results</Text>
      <Text style={styles.subtitle}>{test?.test_category || test?.test_type || '—'} · {test?.status || '—'}</Text>

      {COMMON_PARAMS.map((p) => (
        <View key={p.code} style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>{p.label}</Text>
            <Text style={styles.fieldRef}>Ref: {p.ref}</Text>
          </View>
          <TextInput
            style={styles.input}
            value={results[p.code] || ''}
            onChangeText={(v) => handleResultChange(p.code, v)}
            keyboardType="decimal-pad"
            placeholder="Enter observed value"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmitResults}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Submit Results</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 20, textTransform: 'capitalize' },
  field: { marginBottom: 16 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  fieldRef: { fontSize: 11, color: '#9CA3AF' },
  input: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  submitBtn: { backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
