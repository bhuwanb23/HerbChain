import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from '../components';
import ComplianceRegulation from './compliance_regulation';
import AlertsRecall from './alerts_recall';

const CompliancePage = () => {
  const [currentPage, setCurrentPage] = useState('compliance_regulation');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'compliance_regulation':
        return 'Compliance & Regulation';
      case 'alerts_recall':
        return 'Alerts & Recall';
      default:
        return 'Compliance & Regulation';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'compliance_regulation':
        return <ComplianceRegulation />;
      case 'alerts_recall':
        return <AlertsRecall />;
      default:
        return <ComplianceRegulation />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onBack={() => setCurrentPage('compliance_regulation')}
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

export default CompliancePage;
