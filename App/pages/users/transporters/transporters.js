import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from './components/header';
import BottomNavbar from './components/bottom_navbar';
import TransporterDashboard from './dashboard/dashboard';
import TripsPage from './trips';
import PaymentsScreen from './payments/payments';
import TransporterProfileScreen from './profile/profile';
import ReportsScreen from './reports/reports';

const TransportersPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleTransporterNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <TransporterDashboard navigation={navigation} />;
      case 'trips':
        return <TripsPage navigation={navigation} />;
      case 'history':
        return <ReportsScreen navigation={navigation} />;
      case 'payments':
        return <PaymentsScreen navigation={navigation} />;
      case 'profile':
        return <TransporterProfileScreen navigation={navigation} />;
      case 'notifications':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>🔔 Notifications</Text>
            <Text style={styles.placeholderSubtext}>Pickup requests, route updates</Text>
          </View>
        );
      default:
        return <TransporterDashboard navigation={navigation} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Transport Hub';
      case 'trips': return 'Trips Management';
      case 'history': return 'History & Reports';
      case 'payments': return 'Payments';
      case 'profile': return 'Profile & Settings';
      case 'notifications': return 'Notifications';
      default: return 'Transport Hub';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      <View style={styles.content}>
        <Header
          navigation={navigation}
          title={getPageTitle()}
          onNotificationPress={handleTransporterNavigation}
          showNotifications={currentPage !== 'profile'}
        />
        <View style={styles.pageContainer}>
          {renderCurrentPage()}
        </View>
      </View>
      <BottomNavbar
        navigation={{
          ...navigation,
          navigate: handleTransporterNavigation
        }}
        activeTab={currentPage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TransportersPage;
