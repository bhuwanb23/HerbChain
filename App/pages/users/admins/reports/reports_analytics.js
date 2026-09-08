/**
 * ReportsAnalytics — admin screen for analytics KPIs and domain overview.
 * Uses AnalyticsAPI from P16 backend.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { AnalyticsAPI } from '../../../services/apiClient';
import { useAuth } from '../../../contexts/AuthContext';

const DOMAINS = [
  { key: 'herbs', label: '🌿 Herbs', color: '#059669' },
  { key: 'certifications', label: '📜 Certifications', color: '#8B5CF6' },
  { key: 'logistics', label: '🚚 Logistics', color: '#3B82F6' },
  { key: 'manufacturers', label: '🏭 Manufacturing', color: '#F59E0B' },
  { key: 'consumers', label: '👤 Consumers', color: '#EC4899' },
  { key: 'compliance', label: '🛡️ Compliance', color: '#10B981' },
  { key: 'blockchain', label: '⛓️ Blockchain', color: '#6366F1' },
  { key: 'traceability', label: '🔍 Traceability', color: '#14B8A6' },
];

export default function ReportsAnalytics({ navigation }) {
  const { accessToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [domainData, setDomainData] = useState({});
  const [activeDomain, setActiveDomain] = useState('herbs');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dash, herbs, certs, logistics] = await Promise.all([
        AnalyticsAPI.dashboard(accessToken).catch(() => ({})),
        AnalyticsAPI.herbs(accessToken).catch(() => ({})),
        AnalyticsAPI.certifications(accessToken).catch(() => ({})),
        AnalyticsAPI.logistics(accessToken).catch(() => ({})),
      ]);
      setDashboard(dash);
      setDomainData({ herbs, certifications: certs, logistics });
    } catch (_) {}
  }, [accessToken]);

  useEffect(() => { setLoading(true); fetchData().finally(() => setLoading(false)); }, [fetchData]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const loadDomain = async (key) => {
    setActiveDomain(key);
    if (!domainData[key] && accessToken) {
      try {
        const fn = AnalyticsAPI[key];
        if (fn) { const data = await fn(accessToken); setDomainData((prev) => ({ ...prev, [key]: data })); }
      } catch (_) {}
    }
  };

  const d = dashboard || {};
  const dd = domainData[activeDomain] || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#3B82F6" />
      ) : (
        <>
          {/* KPI cards */}
          <View style={styles.kpiGrid}>
            <KpiCard label="Total Batches" value={d.total_batches || d.totalBatches || 0} color="#059669" />
            <KpiCard label="Active Shipments" value={d.active_shipments || d.activeShipments || 0} color="#3B82F6" />
            <KpiCard label="Certifications" value={d.total_certifications || d.certifications || 0} color="#8B5CF6" />
            <KpiCard label="Compliance" value={`${d.compliance_rate || d.complianceRate || 0}%`} color="#10B981" />
          </View>

          {/* Domain tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainBar}>
            {DOMAINS.map((dom) => (
              <TouchableOpacity key={dom.key} style={[styles.domainTab, activeDomain === dom.key && { borderBottomColor: dom.color }]}
                onPress={() => loadDomain(dom.key)}>
                <Text style={[styles.domainText, activeDomain === dom.key && { color: dom.color }]}>{dom.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Domain data */}
          <View style={styles.domainCard}>
            <Text style={styles.domainTitle}>{DOMAINS.find((d) => d.key === activeDomain)?.label || activeDomain}</Text>
            {Object.keys(dd).length > 0 ? (
              Object.entries(dd).filter(([k]) => !k.startsWith('_')).slice(0, 8).map(([key, val]) => (
                <View key={key} style={styles.dataRow}>
                  <Text style={styles.dataKey}>{key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.dataVal}>{typeof val === 'object' ? JSON.stringify(val).slice(0, 50) : String(val)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>Loading {activeDomain} data...</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={[styles.kpiLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  kpiCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  kpiValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  kpiLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  domainBar: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  domainTab: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  domainText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  domainCard: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 8, marginBottom: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  domainTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dataKey: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize', flex: 1 },
  dataVal: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
  noData: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
});
