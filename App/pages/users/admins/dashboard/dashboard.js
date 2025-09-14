import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaWrapper, BottomSpacer } from '../../../../components';

const AdminDashboard = ({ navigation }) => {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage the HerbChain ecosystem</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardTitle}>Total Users</Text>
            <Text style={styles.cardSubtitle}>1,247 registered users</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🌿</Text>
            <Text style={styles.cardTitle}>Herb Batches</Text>
            <Text style={styles.cardSubtitle}>3,456 batches tracked</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>📈</Text>
            <Text style={styles.cardTitle}>System Health</Text>
            <Text style={styles.cardSubtitle}>99.9% uptime</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🔒</Text>
            <Text style={styles.cardTitle}>Security</Text>
            <Text style={styles.cardSubtitle}>All systems secure</Text>
          </View>
        </View>

        <BottomSpacer extraPadding={20} />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
