import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WelcomeBanner = ({ transporterInfo }) => {
  return (
    <LinearGradient
      colors={['#3B82F6', '#1D4ED8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{transporterInfo.name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Icon name="circle" size={8} color="#22c55e" />
            <Text style={styles.statusText}>{transporterInfo.status}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="directions-truck" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.infoLabel}>Vehicle ID</Text>
            <Text style={styles.infoValue}>{transporterInfo.vehicleId}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="local-shipping" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.infoLabel}>Active Trips</Text>
            <Text style={styles.infoValue}>{transporterInfo.activeTrips}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="star" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>{transporterInfo.rating}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  name: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2, // Added padding to prevent text wrapping
  },
  infoLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center', // Center align the label
  },
  infoValue: {
    fontSize: 12, // Reduced font size to prevent wrapping
    color: 'white',
    fontWeight: '600',
    textAlign: 'center', // Center align the value
    lineHeight: 14, // Added line height for better text display
  },
});

export default WelcomeBanner;
