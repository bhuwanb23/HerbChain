import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BottomNavbar = ({ navigation, activeTab = 'home' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'herb', label: 'Herb', icon: '🌿' },
    { id: 'payment', label: 'Payment', icon: '💰' },
    { id: 'training', label: 'Training', icon: '📚' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handleTabPress = (tabId) => {
    setCurrentTab(tabId);
    
    // Navigate to different screens based on tab
    switch (tabId) {
      case 'home':
        navigation.navigate('FarmerDashboard');
        break;
      case 'herb':
        // Navigate to herb management screen
        navigation.navigate('HerbManagement');
        break;
      case 'payment':
        // Navigate to payment screen
        navigation.navigate('PaymentScreen');
        break;
      case 'training':
        // Navigate to training screen
        navigation.navigate('TrainingScreen');
        break;
      case 'profile':
        // Navigate to profile screen
        navigation.navigate('ProfileScreen');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              currentTab === tab.id && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabIcon,
              currentTab === tab.id && styles.activeTabIcon
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              currentTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#22C55E',
    fontWeight: '600',
  },
});

export default BottomNavbar;
