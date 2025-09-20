import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const FarmerSpotlight = ({ farmer }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farmer Spotlight</Text>
      <View style={styles.farmerInfo}>
        <Image source={{ uri: farmer.avatar }} style={styles.avatar} />
        <View style={styles.details}>
          <Text style={styles.name}>{farmer.name}</Text>
          <Text style={styles.title}>{farmer.title}</Text>
          <Text style={styles.description}>{farmer.description}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: COLORS.gray[500],
    lineHeight: 18,
  },
});

export default FarmerSpotlight;
