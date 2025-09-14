import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../../components';

// Import all farmer pages
import Dashboard from './dashboard/dashboard';
import HerbRegisterScreen from './herb_register/HerbRegisterScreen';
import PaymentsScreen from './payments/payements';
import TrainingScreen from './trainings/training';
import ProfileScreen from './profile/profile';

// Import bottom navbar and header
import BottomNavbar from './components/bottom_navbar';
import Header from './components/header';

const FarmerMainPage = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState('home');

  // Handle navigation between farmer pages
  const handleFarmerNavigation = (page) => {
    setCurrentPage(page);
  };

  // Get page title based on current page
  const getPageTitle = () => {
    switch (currentPage) {
      case 'home':
        return 'HerbChain';
      case 'herb':
        return 'Herb Registration';
      case 'payment':
        return 'Transactions';
      case 'training':
        return 'Training';
      case 'profile':
        return 'Profile';
      default:
        return 'HerbChain';
    }
  };

  // Render the current page based on state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Dashboard navigation={navigation} />;
      case 'herb':
        return <HerbRegisterScreen navigation={navigation} />;
      case 'payment':
        return <PaymentsScreen navigation={navigation} />;
      case 'training':
        return <TrainingScreen navigation={navigation} />;
      case 'profile':
        return <ProfileScreen navigation={navigation} />;
      default:
        return <Dashboard navigation={navigation} />;
    }
  };

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <View style={styles.content}>
        <Header navigation={navigation} title={getPageTitle()} />
        <View style={styles.pageContainer}>
          {renderCurrentPage()}
        </View>
      </View>
      <BottomNavbar 
        navigation={{ 
          ...navigation, 
          navigate: handleFarmerNavigation 
        }} 
        activeTab={currentPage} 
      />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default FarmerMainPage;
