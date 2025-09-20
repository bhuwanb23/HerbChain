import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import DashboardHeader from './components/DashboardHeader';
import WelcomeBanner from './components/WelcomeBanner';
import DashboardCard from './components/DashboardCard';
import NotificationsSection from './components/NotificationsSection';
import QuickStats from './components/QuickStats';
import RecentCertifications from './components/RecentCertifications';
import MonthlyProductionChart from './components/MonthlyProductionChart';
import QuickActions from './components/QuickActions';
import useDashboardData from './hooks/useDashboardData';
import {
  MANUFACTURER_NAME, 
  COMPANY_NAME,
  CURRENT_DATE,
  CURRENT_WEATHER,
  WEATHER_STATUS,
  AVATAR_URL,
  NOTIFICATIONS_DATA // Keep this as a default for NotificationsSection
} from './constants/dashboardConstants';

const DashboardPage = ({ navigation }) => {
  const { 
    loading, 
    error, 
    dashboardCards, 
    notifications, 
    recentCertifications, 
    monthlyProduction, 
    quickActions 
  } = useDashboardData();

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
    <View style={styles.fullContainer}> 
      <DashboardHeader 
        navigation={navigation}
        manufacturerName={MANUFACTURER_NAME}
        avatarUrl={AVATAR_URL}
        notificationsCount={notifications?.length || 0} // Use optional chaining and default to 0
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        <WelcomeBanner 
          manufacturerName={MANUFACTURER_NAME}
          companyName={COMPANY_NAME}
          currentDate={CURRENT_DATE}
          currentWeather={CURRENT_WEATHER}
          weatherStatus={WEATHER_STATUS}
        />

        <QuickStats dashboardCards={dashboardCards} />

        <NotificationsSection notifications={notifications} />

        <RecentCertifications certificationData={recentCertifications} />

        <MonthlyProductionChart monthlyProductionData={monthlyProduction} />

        <QuickActions quickActionsData={quickActions} navigation={navigation} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 10, // Adjust padding as needed
    paddingVertical: 10,
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
});

export default DashboardPage;