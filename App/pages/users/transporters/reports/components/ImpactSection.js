import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = ({ label, color }) => (
  <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '33' }]}> 
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const ImpactSection = ({ data }) => {
  if (!data) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environmental Impact</Text>
      <View style={styles.row}>
        <View style={[styles.card, styles.green]}>
          <Text style={styles.label}>CO₂ Saved</Text>
          <Text style={styles.value}>{data.co2SavedKg} kg</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Badges</Text>
          <View style={styles.badgesRow}>
            {data.badges.map((b) => (
              <Badge key={b.id} label={b.label} color={b.color} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
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
  card: {
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
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ImpactSection;


