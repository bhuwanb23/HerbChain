import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaWrapper } from '../../../components';
import { Ionicons } from '@expo/vector-icons';

// Import consumer screens
import TraceabilityScreenSimple from './traceability/TraceabilityScreenSimple';

const ConsumerMainPage = ({ navigation }) => {
  const [currentPage, setCurrentPage] = useState('home');

  // Handle navigation between consumer pages
  const handleConsumerNavigation = (page) => {
    setCurrentPage(page);
  };

  // Get page title based on current page
  const getPageTitle = () => {
    switch (currentPage) {
      case 'home':
        return 'Consumer Dashboard';
      case 'traceability':
        return 'Product Traceability';
      default:
        return 'Consumer Dashboard';
    }
  };

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <TraceabilityScreenSimple 
            navigation={navigation} 
            route={{ params: { batchId: 'HERB-ASH-001' } }}
          />
        );
      case 'traceability':
        return (
          <TraceabilityScreenSimple 
            navigation={navigation} 
            route={{ params: { batchId: 'HERB-ASH-001' } }}
          />
        );
      case 'history':
        return (
          <TraceabilityScreenSimple 
            navigation={navigation} 
            route={{ params: { batchId: 'HERB-ASH-002' } }}
          />
        );
      case 'profile':
        return (
          <TraceabilityScreenSimple 
            navigation={navigation} 
            route={{ params: { batchId: 'HERB-ASH-003' } }}
          />
        );
      default:
        return (
          <TraceabilityScreenSimple 
            navigation={navigation} 
            route={{ params: { batchId: 'HERB-ASH-001' } }}
          />
        );
    }
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={styles.content}>
        {renderCurrentPage()}
      </View>

      {/* Simple bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, currentPage === 'home' && styles.activeNavItem]}
          onPress={() => handleConsumerNavigation('home')}
        >
          <Ionicons 
            name={currentPage === 'home' ? 'home' : 'home-outline'} 
            size={24} 
            color={currentPage === 'home' ? '#87A96B' : '#666'} 
          />
          <Text style={[styles.navLabel, currentPage === 'home' && styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentPage === 'traceability' && styles.activeNavItem]}
          onPress={() => handleConsumerNavigation('traceability')}
        >
          <Ionicons 
            name={currentPage === 'traceability' ? 'search' : 'search-outline'} 
            size={24} 
            color={currentPage === 'traceability' ? '#87A96B' : '#666'} 
          />
          <Text style={[styles.navLabel, currentPage === 'traceability' && styles.activeNavLabel]}>Trace</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentPage === 'history' && styles.activeNavItem]}
          onPress={() => handleConsumerNavigation('history')}
        >
          <Ionicons 
            name={currentPage === 'history' ? 'time' : 'time-outline'} 
            size={24} 
            color={currentPage === 'history' ? '#87A96B' : '#666'} 
          />
          <Text style={[styles.navLabel, currentPage === 'history' && styles.activeNavLabel]}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentPage === 'profile' && styles.activeNavItem]}
          onPress={() => handleConsumerNavigation('profile')}
        >
          <Ionicons 
            name={currentPage === 'profile' ? 'person' : 'person-outline'} 
            size={24} 
            color={currentPage === 'profile' ? '#87A96B' : '#666'} 
          />
          <Text style={[styles.navLabel, currentPage === 'profile' && styles.activeNavLabel]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // Add any active state styling if needed
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#666',
  },
  activeNavLabel: {
    color: '#87A96B',
  },
});

export default ConsumerMainPage;
