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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#DCFCE7',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    backdropFilter: 'blur(4px)',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#DCFCE7',
  },
});

export default GreetingSection;
