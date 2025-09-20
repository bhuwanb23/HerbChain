import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const ProfileTabNavigation = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'business', label: 'Business' },
    { id: 'staff', label: 'Staff' },
    { id: 'billing', label: 'Billing' },
    { id: 'security', label: 'Security' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <View style={styles.tabNavigationContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton,
            ]}
            onPress={() => onSelectTab(tab.id)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabNavigationContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scrollViewContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  activeTabButton: {
    borderBottomColor: '#059669', // primary color
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabButtonText: {
    color: '#059669', // primary color
  },
});

export default ProfileTabNavigation;