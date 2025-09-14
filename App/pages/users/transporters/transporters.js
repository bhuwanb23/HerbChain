import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from './components/header';
import BottomNavbar from './components/bottom_navbar';
import TransporterDashboard from './dashboard/dashboard';

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
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>🚚 Trips Page</Text>
            <Text style={styles.placeholderSubtext}>Batch Scan, Active Trips, Delivery Confirmation</Text>
          </View>
        );
      case 'history':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>📜 History & Reports</Text>
            <Text style={styles.placeholderSubtext}>Past trips, receipts, and analytics</Text>
          </View>
        );
      case 'payments':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>💰 Payments & Incentives</Text>
            <Text style={styles.placeholderSubtext}>Earnings, sustainability rewards</Text>
          </View>
        );
      case 'profile':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>⚙️ Profile & Settings</Text>
            <Text style={styles.placeholderSubtext}>Vehicle info, language, security, support</Text>
          </View>
        );
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
