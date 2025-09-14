import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from '../components';
import AdminDashboard from './dashboard';
import BatchTraceability from './batch_traceability';

const DashboardMonitoringPage = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'batch_traceability':
        return 'Batch Traceability';
      default:
        return 'Dashboard & Monitoring';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'batch_traceability':
        return <BatchTraceability />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onBack={() => setCurrentPage('dashboard')}
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

export default DashboardMonitoringPage;
