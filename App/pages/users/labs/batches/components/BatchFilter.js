import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FilterButton = ({ title, iconName, isActive, onPress, activeColor, textColor, iconColor }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isActive ? { backgroundColor: activeColor || '#00BFFF' } : styles.inactiveButton]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, isActive ? { color: textColor || '#FFFFFF' } : styles.inactiveButtonText]}>
        {title}
      </Text>
      {iconName && (
        <Icon
          name={iconName}
          size={16}
          color={isActive ? (iconColor || '#FFFFFF') : '#6B7280'}
          style={styles.icon}
        />
      )}
    </TouchableOpacity>
  );
};

const BatchFilter = ({ 
  activeBatchFilter, 
  setActiveBatchFilter, 
  activeHerbFilter, 
  setActiveHerbFilter, 
  activeLocationFilter, 
  setActiveLocationFilter, 
  activeStatusFilter, 
  setActiveStatusFilter 
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
        <FilterButton
          title="All Batches"
          isActive={activeBatchFilter === 'All Batches'}
          onPress={() => setActiveBatchFilter('All Batches')}
          activeColor="#00BFFF"
        />
        <FilterButton
          title="Tulsi"
          iconName="eco"
          isActive={activeHerbFilter === 'Tulsi'}
          onPress={() => setActiveHerbFilter('Tulsi')}
          activeColor="#22C55E"
          iconColor="#FFFFFF"
        />
        <FilterButton
          title="Rajasthan"
          iconName="place"
          isActive={activeLocationFilter === 'Rajasthan'}
          onPress={() => setActiveLocationFilter('Rajasthan')}
          activeColor="#EF4444"
          iconColor="#FFFFFF"
        />
        <FilterButton
          title="Pending"
          iconName="schedule"
          isActive={activeStatusFilter === 'Pending'}
          onPress={() => setActiveStatusFilter('Pending')}
          activeColor="#EAB308"
          iconColor="#FFFFFF"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
  },
  filterScrollView: {
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inactiveButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inactiveButtonText: {
    color: '#374151',
  },
  icon: {
    marginLeft: 5,
  },
});

export default BatchFilter;
