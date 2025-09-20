import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RawHerbSectionTabs = ({ activeSection, onSelectSection }) => {
  const sections = [
    { id: 'available_herbs', label: 'Available Herbs' },
    { id: 'ordered_herbs', label: 'Ordered Herbs' },
    { id: 'scanned_details', label: 'Scanned Details' },
  ];

  return (
    <View style={styles.tabsContainer}>
      {sections.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.tabButton,
            activeSection === section.id && styles.activeTabButton,
          ]}
          onPress={() => onSelectSection(section.id)}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeSection === section.id && styles.activeTabButtonText,
            ]}
          >
            {section.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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

export default RawHerbSectionTabs;