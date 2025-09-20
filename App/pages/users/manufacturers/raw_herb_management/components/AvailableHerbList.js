import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AvailableHerbItem from './AvailableHerbItem';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AvailableHerbList = ({ availableHerbs, onOrderHerb, getStatusStyle, onItemPress }) => {
  return (
    <View style={styles.container}>
      {availableHerbs.length > 0 ? (
        <FlatList
          data={availableHerbs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AvailableHerbItem
              herb={item}
              onOrderHerb={onOrderHerb}
              getStatusStyle={getStatusStyle}
              onPress={() => onItemPress(item)} // Pass item to onPress
            />
          )}
          contentContainerStyle={styles.herbListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyListContainer}>
          <Icon name="info-outline" size={40} color="#9ca3af" />
          <Text style={styles.emptyListText}>No available herbs to display.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  herbListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    rowGap: 12,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default AvailableHerbList;