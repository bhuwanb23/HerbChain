import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BottomNavbar = ({ navigation, activeTab = 'home' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'herb', label: 'Herb', icon: 'eco' },
    { id: 'payment', label: 'Payment', icon: 'payment' },
    { id: 'training', label: 'Training', icon: 'school' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const handleTabPress = (tabId) => {
    setCurrentTab(tabId);
    
    // Use internal navigation for farmer pages
    if (navigation.navigate) {
      navigation.navigate(tabId);
    }
  };

  return (
    <View style={[styles.container]}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.navbar}
      >
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
            <View style={[
              styles.iconContainer,
              currentTab === tab.id && styles.activeIconContainer
            ]}>
              <Icon 
                name={tab.icon} 
                size={20} 
                color={currentTab === tab.id ? '#ffffff' : '#6b7280'} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: -4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 8,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    paddingTop: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 50,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    borderRadius: 50,
    shadowRadius: 4,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#22c55e',
    fontWeight: '600',
  },
});

export default BottomNavbar;
