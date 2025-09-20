import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DashboardCard = ({ title, value, iconName, color = '#22c55e' }) => {
  return (
    <View style={[styles.cardContainer, { borderColor: color }]}>
      <View style={[styles.iconWrapper, { backgroundColor: color + '1A' }]}>
        <Icon name={iconName} size={24} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    margin: 8,
    borderWidth: 0, // Remove explicit border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 160,
    maxWidth: '48%', // Allow two cards per row with some space
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default DashboardCard;