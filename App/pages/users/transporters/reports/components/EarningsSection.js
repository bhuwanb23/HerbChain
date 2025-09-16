import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Bar = ({ label, value, max }) => {
  const widthPct = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: widthPct + '%' }]} />
      </View>
      <Text style={styles.barValue}>{value.toLocaleString()}</Text>
    </View>
  );
};

const EarningsSection = ({ data }) => {
  const maxVal = Math.max(...data.trend.map(t => t.value), 1);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.green]}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>₹ {data.total.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Payments</Text>
          <Text style={styles.summaryValue}>₹ {data.pending.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Bonuses</Text>
          <Text style={styles.summaryValue}>₹ {data.bonuses.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.subTitle}>Earnings Trend</Text>
      <View style={styles.chart}>
        {data.trend.map((t) => (
          <Bar key={t.label} label={t.label} value={t.value} max={maxVal} />
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
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  green: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  chart: {
    marginTop: 6,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 28,
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  barFill: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 999,
  },
  barValue: {
    width: 70,
    textAlign: 'right',
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default EarningsSection;


