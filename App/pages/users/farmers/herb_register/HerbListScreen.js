import React from 'react';
import { View } from 'react-native';
import HerbList from './components/HerbList';
import { useHerbList } from './hooks/useHerbList';
import { useAuth } from '../../../../contexts/AuthContext';

const HerbListScreen = ({ navigation, onAdd, onOpenDetails }) => {
  const { accessToken } = useAuth();
  const { items, loading, refetch } = useHerbList(accessToken);

  return (
    <View style={{ flex: 1 }}>
      <HerbList 
        data={items} 
        loading={loading} 
        onRefresh={refetch} 
        onAdd={onAdd || (() => {})}
        onItemPress={onOpenDetails || (() => {})}
      />
    </View>
  );
};

export default HerbListScreen;


