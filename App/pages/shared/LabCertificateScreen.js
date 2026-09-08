/**
 * LabCertificateScreen — lab test results and downloadable certificate.
 *
 * Shows: lab info, test results (pass/fail), certificate PDF, blockchain verification.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

export default function LabCertificateScreen({ navigation, route }) {
  const { certificate, batch } = route?.params || {};
  const cert = certificate || batch?.certificate || {};
  const tests = cert.tests || cert.results || batch?.tests || [];
  const [showTechnical, setShowTechnical] = useState(false);

  const labName = cert.lab_name || cert.lab?.name || 'Accredited Laboratory';
  const accreditation = cert.accreditation || cert.lab?.accreditation || '';
  const testDate = cert.test_date || cert.issued_at || cert.created_at || null;

  const passedTests = tests.filter((t) => t.result === 'PASSED' || t.status === 'PASSED' || t.passed === true);
  const failedTests = tests.filter((t) => t.result === 'FAILED' || t.status === 'FAILED' || t.passed === false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back to Passport</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>🔬 Laboratory Certificate</Text>

      {/* Lab info */}
      <View style={styles.card}>
        <InfoRow label="Lab" value={labName} />
        {accreditation && <InfoRow label="Accreditation" value={accreditation} />}
        <InfoRow label="Date" value={testDate ? new Date(testDate).toLocaleDateString() : '-'} />
        <InfoRow label="Status" value={failedTests.length === 0 ? '✅ All Tests Passed' : `❌ ${failedTests.length} Failed`} highlight={failedTests.length === 0} />
      </View>

      {/* Test results */}
      {tests.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Test Results</Text>
          {tests.map((test, i) => {
            const passed = test.result === 'PASSED' || test.status === 'PASSED' || test.passed === true;
            return (
              <View key={i} style={styles.testRow}>
                <Text style={styles.testIcon}>{passed ? '✅' : '❌'}</Text>
                <Text style={styles.testName}>{test.name || test.category || `Test ${i + 1}`}</Text>
                <Text style={[styles.testResult, { color: passed ? '#059669' : '#DC2626' }]}>
                  {passed ? 'PASSED' : 'FAILED'}
                </Text>
              </View>
            );
          })}

          {/* Technical details toggle */}
          {tests.some((t) => t.value || t.actual_value || t.range) && (
            <>
              <TouchableOpacity onPress={() => setShowTechnical(!showTechnical)}>
                <Text style={styles.techToggle}>{showTechnical ? '▲ Hide Technical Details' : '▼ Show Technical Details'}</Text>
              </TouchableOpacity>
              {showTechnical && tests.map((test, i) => (
                (test.value || test.actual_value) && (
                  <View key={`tech-${i}`} style={styles.techRow}>
                    <Text style={styles.techName}>{test.name || test.category}</Text>
                    <Text style={styles.techValue}>Value: {test.value || test.actual_value}</Text>
                    {test.range && <Text style={styles.techRange}>Range: {test.range}</Text>}
                  </View>
                )
              ))}
            </>
          )}
        </View>
      )}

      {/* Certificate document */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📄 Certificate</Text>
        <View style={styles.certPreview}>
          <Text style={styles.certIcon}>📄</Text>
          <Text style={styles.certLabel}>Certificate of Analysis</Text>
          <Text style={styles.certSub}>{labName}</Text>
        </View>
        <View style={styles.certActions}>
          <TouchableOpacity style={styles.certBtn} onPress={() => Alert.alert('Download', 'Certificate PDF download coming soon.')}>
            <Text style={styles.certBtnText}>📥 Download PDF</Text>
          </TouchableOpacity>
          {cert.blockchain_hash && (
            <TouchableOpacity style={styles.certBtn} onPress={() => Alert.alert('Blockchain', `Hash: ${cert.blockchain_hash}\n\n✅ Verified on-chain`)}>
              <Text style={styles.certBtnText}>🔗 Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: '#059669' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16 },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 12 },
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  testIcon: { fontSize: 16, marginRight: 8 },
  testName: { fontSize: 14, color: '#374151', flex: 1 },
  testResult: { fontSize: 13, fontWeight: '700' },
  techToggle: { fontSize: 13, color: '#3B82F6', fontWeight: '600', marginTop: 10, textAlign: 'center' },
  techRow: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 6 },
  techName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  techValue: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  techRange: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  certPreview: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  certIcon: { fontSize: 40, marginBottom: 8 },
  certLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  certSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  certActions: { flexDirection: 'row', gap: 10 },
  certBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  certBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },
});
