import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LineageItem from './LineageItem';

const ProductLineage = ({ lineageData }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Lineage</Text>
        <Icon name="bubble_chart" size={20} color="#16a34a" />
      </View>
      <FlatList
        data={lineageData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LineageItem item={item} />}
        contentContainerStyle={styles.lineageListContent}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  lineageListContent: {
    rowGap: 12, // space-y-3
  },
});

export default ProductLineage;