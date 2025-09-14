import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminHeader, AdminBottomNavbar } from '../components';
import UserManagement from './user_management';
import ProfileSettings from './profile_settings';

const UserControlPage = () => {
  const [currentPage, setCurrentPage] = useState('user_management');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'user_management':
        return 'User Management';
      case 'profile_settings':
        return 'Profile & Settings';
      default:
        return 'User & Role Control';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'user_management':
        return <UserManagement />;
      case 'profile_settings':
        return <ProfileSettings />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title={getPageTitle()}
        onBack={() => setCurrentPage('user_management')}
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

export default UserControlPage;
