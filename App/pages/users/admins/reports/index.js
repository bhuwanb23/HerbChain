import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from '../components';
import ReportsAnalytics from './reports_analytics';
import IncentivesFunding from './incentives_funding';

const ReportsPage = () => {
  const [currentPage, setCurrentPage] = useState('reports_analytics');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'reports_analytics':
        return 'Reports & Analytics';
      case 'incentives_funding':
        return 'Incentives & Funding';
      default:
        return 'Reports & Insights';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'reports_analytics':
        return <ReportsAnalytics />;
      case 'incentives_funding':
        return <IncentivesFunding />;
      default:
        return <ReportsAnalytics />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onBack={() => setCurrentPage('reports_analytics')}
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

export default ReportsPage;
