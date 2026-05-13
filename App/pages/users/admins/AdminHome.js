/**
 * Admin v1 home — real-time stats from the backend.
 *
 * Backed by:
 *     GET /admin/api/stats
 *     GET /admin/api/users
 *     GET /admin/api/batches
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await AdminAPI.stats(accessToken);
      setStats(data);
    } catch (err) {
      Alert.alert('Could not load stats', err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

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
      {loading || !stats ? (
        <View style={styles.center}>
          <ActivityIndicator color="#F59E0B" />
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <StatCard label="Total users" value={stats.users?.total ?? 0} />
            <StatCard label="Total batches" value={stats.batches?.total ?? 0} />
            <StatCard label="Total products" value={stats.products?.total ?? 0} />
            <StatCard label="Lab reports" value={stats.lab_reports?.total ?? 0} />
            <StatCard
              label="New batches (7d)"
              value={stats.batches?.new_last_7_days ?? 0}
            />
            <StatCard
              label="Events (7d)"
              value={stats.events?.last_7_days ?? 0}
            />
          </View>

          <Section title="Users by role">
            {Object.entries(stats.users?.by_role || {}).map(([role, count]) => (
              <Row key={role} label={role} value={count} />
            ))}
          </Section>

          <Section title="Batches by phase">
            {Object.entries(stats.batches?.by_phase || {}).map(([phase, count]) => (
              <Row key={phase} label={phase} value={count} />
            ))}
          </Section>

          <Section title="Test results">
            {Object.entries(stats.batches?.by_test_result || {}).map(([k, count]) => (
              <Row key={k} label={k} value={count} />
            ))}
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
  rowLabel: { color: '#374151', textTransform: 'capitalize' },
  rowValue: { fontWeight: '700', color: '#111827' },
});
