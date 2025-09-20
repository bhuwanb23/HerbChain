import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Header from './components/header';
import BottomNavbar from './components/bottom_navbar';
import DashboardPage from './dashboard/dashboard';
import BatchesPage from './batches/batches';
import TestingPage from './testing/testing';
import ReportsPage from './reports/reports';
import ProfilePage from './profile/profile';
import { COLORS } from './testing/constants'; // Import COLORS

const LabsPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLabNavigation = (pageId) => {
    setCurrentPage(pageId);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage navigation={navigation} />;
      case 'batches':
        return <BatchesPage navigation={navigation} />;
      case 'testing':
        return <TestingPage navigation={navigation} />;
      case 'reports':
        return <ReportsPage navigation={navigation} />;
      case 'profile':
        return <ProfilePage navigation={navigation} />;
      default:
        return <DashboardPage navigation={navigation} />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Lab Dashboard';
      case 'batches': return 'Batch Management';
      case 'testing': return 'Testing & Analysis';
      case 'reports': return 'Reports & Analytics';
      case 'profile': return 'Profile & Settings';
      default: return 'Lab Dashboard';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Header
          navigation={navigation}
          title={getPageTitle()}
          onNotificationPress={handleLabNavigation}
        />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {renderCurrentPage()}
      </View>

      {/* Bottom Navbar */}
      <View style={styles.bottomNavbar}>
        <BottomNavbar
          navigation={{
            ...navigation,
            navigate: handleLabNavigation
          }}
          activeTab={currentPage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  header: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  bottomNavbar: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 1000,
  },
});

export default LabsPage;
