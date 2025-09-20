import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import WelcomeBanner from './components/WelcomeBanner';
import DashboardCard from './components/DashboardCard';
import NotificationsSection from './components/NotificationsSection';
import useDashboardData from './hooks/useDashboardData';
import { MANUFACTURER_NAME } from './constants/dashboardConstants';

const DashboardPage = () => {
  const { loading, error, dashboardCards, notifications } = useDashboardData();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading dashboard: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <WelcomeBanner manufacturerName={MANUFACTURER_NAME} />

      <View style={styles.cardsContainer}>
        {dashboardCards.map((card) => (
          <DashboardCard
            key={card.id}
            title={card.title}
            value={card.value}
            iconName={card.iconName}
            color={card.color}
          />
        ))}
      </View>

      <NotificationsSection notifications={notifications} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Changed from space-around to space-between
    width: '100%',
    marginBottom: 25,
    rowGap: 16, // Add vertical gap between rows of cards
  },
});

export default DashboardPage;