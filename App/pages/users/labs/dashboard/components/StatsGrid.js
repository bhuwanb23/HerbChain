import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATS_DATA } from '../constants';

const StatCard = ({ data }) => {
  return (
    <View style={[
      styles.card,
      styles.cardBorder,
      {
        backgroundColor: data.backgroundColor,
        borderColor: data.borderColor,
      }
    ]}>
      <View style={styles.cardHeader}>
        <Ionicons name={data.icon} size={24} color={data.iconColor} />
        <Text style={[styles.cardValue, { color: data.valueColor }]}>
          {data.value}
        </Text>
      </View>
      <Text style={[styles.cardTitle, { color: data.titleColor }]}>
        {data.title}
      </Text>
      <Text style={[styles.cardSubtitle, { color: data.subtitleColor }]}>
        {data.subtitle}
      </Text>
    </View>
  );
};

const StatsGrid = () => {
  return (
    <View style={styles.statsGrid}>
      {STATS_DATA.map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardBorder: {
    borderColor: '#E5E7EB',
  },
});

export default StatsGrid;
