/**
 * Admin home — real-time portal dashboard from the backend.
 *
 * Backed by:
 *     GET /api/v1/admin/portal/dashboard -> { dashboard: { kpis, widgets, compliance_surface } }
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RoleHomeShell } from '../../../components';
import { useAuth } from '../../../contexts/AuthContext';
import { AdminAPI } from '../../../services/apiClient';

export default function AdminHome() {
  const { accessToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await AdminAPI.portalDashboard(accessToken);
      setDashboard(data?.dashboard || data);
    } catch (err) {
      Alert.alert('Could not load dashboard', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = dashboard?.kpis || {};
  const widgets = dashboard?.widgets || {};
  const surface = dashboard?.compliance_surface || {};

  return (
    <RoleHomeShell
      title="Admin overview"
      subtitle="System-wide stats from the backend"
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      {loading || !dashboard ? (
        <View style={styles.center}>
          <ActivityIndicator color="#F59E0B" />
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard label="Farmers" value={kpis.total_farmers ?? 0} />
            <StatCard label="Labs" value={kpis.total_labs ?? 0} />
            <StatCard label="Manufacturers" value={kpis.total_manufacturers ?? 0} />
            <StatCard label="Transporters" value={kpis.total_transporters ?? 0} />
            <StatCard label="Active batches" value={kpis.active_batches ?? 0} />
            <StatCard label="Active shipments" value={kpis.active_shipments ?? 0} />
            <StatCard label="Certified batches" value={kpis.certified_batches ?? 0} />
            <StatCard label="Products" value={kpis.products_created ?? 0} />
          </View>

          <Section title="Supply chain">
            <Row label="Rejected batches" value={kpis.rejected_batches ?? 0} />
            <Row label="Recalled products" value={kpis.products_recalled ?? 0} />
            <Row label="Blockchain transactions" value={kpis.blockchain_transactions ?? 0} />
            <Row label="Pending approvals" value={kpis.pending_approvals ?? 0} />
          </Section>

          <Section title="Compliance">
            <Row label="Open alerts" value={kpis.compliance_alerts ?? 0} />
            <Row label="Failed certifications" value={kpis.failed_certifications ?? 0} />
            <Row label="Suspicious activities" value={surface.suspicious_activities ?? 0} />
            <Row label="Certificates expiring soon" value={surface.certificate_expiry_soon ?? 0} />
          </Section>

          <Section title="Network activity">
            <Row label="Farmers registered" value={widgets.farmers?.registered ?? 0} />
            <Row label="Farmers verified" value={widgets.farmers?.verified ?? 0} />
            <Row label="New farmers (30d)" value={widgets.farmers?.new_registrations_30d ?? 0} />
            <Row label="Active labs" value={widgets.labs?.active_labs ?? 0} />
            <Row label="Shipments in transit" value={widgets.logistics?.shipments_in_transit ?? 0} />
            <Row label="Successful deliveries" value={widgets.logistics?.successful_deliveries ?? 0} />
          </Section>
        </>
      )}
    </RoleHomeShell>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', padding: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  statLabel: { color: '#6B7280', marginTop: 4 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#92400E', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: '#374151' },
  rowValue: { fontWeight: '700', color: '#111827' },
});
