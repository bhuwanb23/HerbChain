import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Tag = ({ text, color = '#6B7280' }) => (
  <View style={[styles.tag, { backgroundColor: color + '1A', borderColor: color + '33' }]}> 
    <Text style={[styles.tagText, { color }]}>{text}</Text>
  </View>
);

const ComplianceSection = ({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compliance & Quality</Text>

      <View style={styles.row}>
        <View style={[styles.kpiCard, styles.kpiGreen]}>
          <Text style={styles.kpiLabel}>Compliant Trips</Text>
          <Text style={styles.kpiValue}>{data.compliantRate}%</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Failed</Text>
          <Text style={styles.kpiValue}>{data.failedDeliveries}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Disputes</Text>
          <Text style={styles.kpiValue}>{data.disputes}</Text>
        </View>
      </View>

      <Text style={styles.subTitle}>Top Reasons</Text>
      <View style={styles.tagsRow}>
        {data.reasons.map((r) => (
          <Tag key={r.id} text={`${r.label} (${r.count})`} color="#EF4444" />
        ))}
      </View>

      <Text style={styles.subTitle}>Blockchain Logs</Text>
      <View style={styles.logs}>
        {data.blockchainLogs.map((l) => (
          <View key={l.id} style={styles.logRow}>
            <Text style={styles.hash}>{l.hash}</Text>
            <Text style={styles.note}>{l.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logs: {
    marginTop: 6,
    gap: 6,
  },
  logRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hash: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#111827',
    marginBottom: 2,
  },
  note: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default ComplianceSection;


