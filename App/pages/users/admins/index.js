import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from './components';
import DashboardMonitoringPage from './dashboard_monitoring';
import UserControlPage from './user_control';
import CompliancePage from './compliance';
import ReportsPage from './reports';
import IntegrationPage from './integration';

const AdminMainPage = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard & Monitoring';
      case 'users':
        return 'User & Role Control';
      case 'compliance':
        return 'Compliance & Regulation';
      case 'reports':
        return 'Reports & Insights';
      case 'integration':
        return 'Integration & Support';
      default:
        return 'AYUSH Admin Panel';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardMonitoringPage />;
      case 'users':
        return <UserControlPage />;
      case 'compliance':
        return <CompliancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'integration':
        return <IntegrationPage />;
      default:
        return <DashboardMonitoringPage />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onProfile={() => console.log('Profile pressed')}
      />
      
      {renderCurrentPage()}
      
      <AdminBottomNavbar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default AdminMainPage;
