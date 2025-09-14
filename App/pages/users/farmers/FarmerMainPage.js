import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../../components';

// Import all farmer pages
import Dashboard from './dashboard/dashboard';
import HerbRegisterScreen from './herb_register/HerbRegisterScreen';
import PaymentsScreen from './payments/payements';
import TrainingScreen from './trainings/training';
import ProfileScreen from './profile/profile';

// Import bottom navbar
import BottomNavbar from './components/bottom_navbar';

const FarmerMainPage = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState('home');

  // Handle navigation between farmer pages
  const handleFarmerNavigation = (page) => {
    setCurrentPage(page);
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
    <View style={styles.container}>
      <SafeAreaWrapper style={styles.safeArea} includeBottom={false}>
        {renderCurrentPage()}
      </SafeAreaWrapper>
      <BottomNavbar 
        navigation={{ 
          ...navigation, 
          navigate: handleFarmerNavigation 
        }} 
        activeTab={currentPage} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
});

export default FarmerMainPage;
