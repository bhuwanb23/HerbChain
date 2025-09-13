import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const GreetingSection = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg' }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.greeting}>Hello Ramesh!</Text>
          <Text style={styles.subtitle}>Here's your progress today</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Harvest Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12.5</Text>
            <Text style={styles.summaryLabel}>kg Harvested</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹2,850</Text>
            <Text style={styles.summaryLabel}>Revenue</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#DCFCE7',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    backdropFilter: 'blur(4px)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#DCFCE7',
  },
});

export default GreetingSection;
