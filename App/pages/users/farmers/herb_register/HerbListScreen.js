import React from 'react';
import { View } from 'react-native';
import HerbList from './components/HerbList';
import { useHerbList } from './hooks/useHerbList';

const HerbListScreen = ({ navigation, onAdd, onOpenDetails }) => {
  // Default farmer ID for development
  const farmerId = 'farmer_001';
  const { items, loading, refresh } = useHerbList(farmerId);

  return (
    <View style={{ flex: 1 }}>
      <HerbList 
        data={items} 
        loading={loading} 
        onRefresh={refresh} 
        onAdd={onAdd || (() => {})}
        onItemPress={onOpenDetails || (() => {})}
      />
    </View>
  );
};

export default HerbListScreen;


