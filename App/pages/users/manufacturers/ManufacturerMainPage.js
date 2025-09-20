import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/header';
import BottomNavbar from './components/bottom_navbar';
import DashboardPage from './dashboard/dashboard';
import RawHerbManagementPage from './raw_herb_management/raw_herb_management';
import ProductionPage from './production/production';
import ReportsPage from './reports/reports';
import ProfilePage from './profile/profile';

const ManufacturerMainPage = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardPage />;
      case 'raw_herb_management':
        return <RawHerbManagementPage />;
      case 'production':
        return <ProductionPage />;
      case 'reports':
        return <ReportsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage />;
    }
  };

  const handleNavbarNavigate = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Manufacturer" showNotifications={true} onNotificationPress={() => navigation.navigate('NotificationsScreen')} />
      <View style={styles.body}>
        {renderContent()}
      </View>
      <BottomNavbar navigation={{ navigate: handleNavbarNavigate }} activeTab={activeTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  body: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ManufacturerMainPage;