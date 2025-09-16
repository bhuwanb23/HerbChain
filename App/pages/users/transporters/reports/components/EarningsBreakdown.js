import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Row = ({ color, icon, title, subtitle, amount, delta }) => (
  <View style={styles.row}> 
    <View style={[styles.iconBox, { backgroundColor: color + '1A' }]}> 
      <Icon name={icon} size={16} color={color} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowAmount}>${amount.toLocaleString()}</Text>
      {!!delta && <Text style={styles.rowDelta}>{delta}</Text>}
    </View>
  </View>
);

const EarningsBreakdown = ({ earnings }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Earnings Breakdown</Text>
      <View style={styles.card}>
        <View style={styles.list}>
          {earnings.breakdown.map((b) => (
            <Row key={b.id} color={b.color} icon={b.icon} title={b.label} subtitle={b.subtitle} amount={b.amount} delta={'+15%'} />
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalValue}>${(earnings.breakdown.reduce((s, i) => s + i.amount, 0)).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { padding: 16 },
  title: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  rowSubtitle: { fontSize: 11, color: '#6B7280' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
  rowDelta: { fontSize: 11, color: '#10B981' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#F3F4F6', marginTop: 12, paddingTop: 10 },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#2563EB' },
});

export default EarningsBreakdown;


