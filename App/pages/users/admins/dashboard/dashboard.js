import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const AdminDashboard = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage the HerbChain ecosystem</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.cardIcon}>👥</Text>
                <Text style={styles.cardTitle}>Total Users</Text>
                <Text style={styles.cardSubtitle}>1,247 registered users</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.cardIcon}>🌿</Text>
                <Text style={styles.cardTitle}>Herb Batches</Text>
                <Text style={styles.cardSubtitle}>3,456 batches tracked</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.cardIcon}>📈</Text>
                <Text style={styles.cardTitle}>System Health</Text>
                <Text style={styles.cardSubtitle}>99.9% uptime</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.cardIcon}>🔒</Text>
                <Text style={styles.cardTitle}>Security</Text>
                <Text style={styles.cardSubtitle}>All systems secure</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  statsGrid: {
    gap: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AdminDashboard;
