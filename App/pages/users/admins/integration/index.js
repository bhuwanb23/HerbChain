import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from '../components';
import IntegrationAPI from './integration_api';
import SupportDispute from './support_dispute';

const IntegrationPage = () => {
  const [currentPage, setCurrentPage] = useState('integration_api');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'integration_api':
        return 'Integration & API';
      case 'support_dispute':
        return 'Support & Dispute';
      default:
        return 'Integration & Support';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'integration_api':
        return <IntegrationAPI />;
      case 'support_dispute':
        return <SupportDispute />;
      default:
        return <IntegrationAPI />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onBack={() => setCurrentPage('integration_api')}
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

export default IntegrationPage;
