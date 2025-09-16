import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Lightweight chart-like visuals using bars and donut proxy
const LineRow = ({ label, value, max }) => {
  const pct = Math.max(4, Math.min(100, Math.round((value / max) * 100)));
  return (
    <View style={styles.lineRow}>
      <Text style={styles.lineLabel}>{label}</Text>
      <View style={styles.lineTrack}>
        <View style={[styles.lineFill, { width: pct + '%' }]} />
      </View>
    </View>
  );
};

const Donut = ({ onTime, delayed }) => {
  const total = onTime + delayed;
  const onTimePct = Math.round((onTime / total) * 100);
  const delayedPct = 100 - onTimePct;
  return (
    <View style={styles.donutCard}>
      <View style={styles.donutCircle}>
        <Text style={styles.donutText}>{onTimePct}%</Text>
      </View>
      <View style={styles.legend}> 
        <View style={styles.legendRow}><View style={[styles.dot,{backgroundColor:'#10B981'}]} /><Text style={styles.legendText}>On-Time</Text></View>
        <View style={styles.legendRow}><View style={[styles.dot,{backgroundColor:'#EF4444'}]} /><Text style={styles.legendText}>Delayed</Text></View>
      </View>
    </View>
  );
};

const ChartsSection = ({ charts }) => {
  const max = Math.max(...charts.tripVolume.data, 1);
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Trip Volume Trends</Text>
          <Text style={styles.cardLink}>View Details</Text>
        </View>
        <View style={styles.lines}>
          {charts.tripVolume.data.map((v, idx) => (
            <LineRow key={charts.tripVolume.categories[idx]} label={charts.tripVolume.categories[idx]} value={v} max={max} />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Delivery Performance</Text>
          <View style={styles.legendWrap}>
            <View style={styles.legendRow}><View style={[styles.dot,{backgroundColor:'#10B981'}]} /><Text style={styles.legendText}>On-Time</Text></View>
            <View style={styles.legendRow}><View style={[styles.dot,{backgroundColor:'#EF4444'}]} /><Text style={styles.legendText}>Delayed</Text></View>
          </View>
        </View>
        <Donut onTime={charts.deliveryPerformance.onTime} delayed={charts.deliveryPerformance.delayed} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  cardLink: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  lines: { gap: 8 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineLabel: { width: 28, fontSize: 11, color: '#6B7280', fontWeight: '600' },
  lineTrack: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 999 },
  lineFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 999 },
  donutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donutCircle: { width: 96, height: 96, borderRadius: 48, borderWidth: 10, borderColor: '#10B981', borderRightColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  donutText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  legend: { gap: 8 },
  legendWrap: { flexDirection: 'row', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});

export default ChartsSection;


