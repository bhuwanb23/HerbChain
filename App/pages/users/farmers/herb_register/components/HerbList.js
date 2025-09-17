import React, { useEffect } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HerbDetailsItem from './HerbDetailsItem';

const HerbList = ({ data, loading, onRefresh, onAdd, onItemPress }) => {
  useEffect(() => {}, [data]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.batch_id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => onItemPress && onItemPress(item)}>
            <HerbDetailsItem batch={item} />
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      />

      <TouchableOpacity style={styles.fab} onPress={onAdd} activeOpacity={0.85}>
        <Icon name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    backgroundColor: '#22c55e',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HerbList;


