import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WelcomeBanner = ({ manufacturerName }) => {
  return (
    <LinearGradient
      colors={['#dcfce7', '#a7f3d0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Icon name="waving-hand" size={30} color="#16a34a" style={styles.icon} />
      <Text style={styles.welcomeText}>Hello {manufacturerName},</Text>
      <Text style={styles.overviewText}>here’s today’s overview.</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 2,
  },
  overviewText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
});

export default WelcomeBanner;