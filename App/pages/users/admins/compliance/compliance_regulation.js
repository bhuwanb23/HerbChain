/**
 * ComplianceRegulation — admin screen for compliance violations and scoring.
 * Uses AdminAPI.complianceAlerts from the new backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { AdminAPI, AnalyticsAPI } from '../../../services/apiClient';
import { useAuth } from '../../../contexts/AuthContext';

const SEVERITY_COLORS = {
  critical: '#DC2626', high: '#F59E0B', medium: '#3B82F6', low: '#9CA3AF',
  CRITICAL: '#DC2626', HIGH: '#F59E0B', MEDIUM: '#3B82F6', LOW: '#9CA3AF',
};

export default function ComplianceRegulation({ navigation }) {
  const { accessToken } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [alertRes, scoreRes] = await Promise.all([
        AdminAPI.complianceAlerts(accessToken, { status: 'open' }),
        AnalyticsAPI.compliance(accessToken, 'monthly'),
      ]);
      setAlerts(alertRes?.alerts || []);
      setScore(scoreRes);
    } catch (_) {}
  }, [accessToken]);

  useEffect(() => { setLoading(true); fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const resolveAlert = async (alertId) => {
    try { await AdminAPI.updateComplianceAlert(accessToken, alertId, { status: 'resolved' }); fetchData(); } catch (_) {}
  };

  const runRules = async () => {
    try { await AdminAPI.runComplianceRules(accessToken); Alert.alert('Done', 'Compliance scan complete.'); fetchData(); } catch (_) {}
  };

  const complianceRate = score?.compliance_rate || score?.complianceRate || 0;
  const totalBatches = score?.total_batches || score?.totalBatches || 0;

  // ─── Detail View ───
  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Violation Detail</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selected.title || selected.type || 'Violation'}</Text>
          <View style={styles.detailMeta}>
            <View style={[styles.sevBadge, { backgroundColor: SEVERITY_COLORS[selected.severity] || '#6B7280' }]}>
              <Text style={styles.sevText}>{selected.severity || 'unknown'}</Text>
            </View>
            <Text style={styles.detailCategory}>{selected.category || '-'}</Text>
          </View>
          <Text style={styles.detailDesc}>{selected.description || selected.message || '-'}</Text>
          <InfoRow label="Entity" value={selected.entity_type ? `${selected.entity_type} · ${selected.entity_id?.slice(0, 8)}` : '-'} />
          <InfoRow label="Created" value={selected.created_at ? new Date(selected.created_at).toLocaleString() : '-'} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.resolveBtn} onPress={() => { resolveAlert(selected.id); setSelected(null); }}>
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── List View ───
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compliance</Text>
        <TouchableOpacity onPress={runRules} style={styles.runBtn}>
          <Text style={styles.runBtnText}>Run Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Score cards */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCard, { borderLeftColor: complianceRate >= 95 ? '#10B981' : complianceRate >= 90 ? '#F59E0B' : '#DC2626' }]}>
          <Text style={styles.scoreLabel}>Compliance Rate</Text>
          <Text style={styles.scoreValue}>{complianceRate}%</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Active Violations</Text>
          <Text style={[styles.scoreValue, { color: '#DC2626' }]}>{alerts.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : alerts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>No active violations</Text>
          <Text style={styles.subtitle}>All compliance checks passed.</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => String(a.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.alertCard} onPress={() => setSelected(item)}>
              <View style={styles.alertRow}>
                <View style={[styles.sevDot, { backgroundColor: SEVERITY_COLORS[item.severity] || '#6B7280' }]} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{item.title || item.type || 'Violation'}</Text>
                  <Text style={styles.alertSub}>{item.category || item.entity_type || '-'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  backBtn: { fontSize: 16, color: '#3B82F6', fontWeight: '600' },
  runBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  runBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 10, padding: 12 },
  scoreCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderLeftWidth: 3, borderLeftColor: '#10B981' },
  scoreLabel: { fontSize: 12, color: '#6B7280' },
  scoreValue: { fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 4 },
  alertCard: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  sevDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  alertSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  detailCard: { backgroundColor: '#FFF', margin: 12, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sevText: { color: '#FFF', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  detailCategory: { fontSize: 13, color: '#6B7280' },
  detailDesc: { fontSize: 14, color: '#374151', marginTop: 12, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  actionRow: { marginTop: 16 },
  resolveBtn: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  resolveBtnText: { color: '#059669', fontSize: 15, fontWeight: '700' },
});
