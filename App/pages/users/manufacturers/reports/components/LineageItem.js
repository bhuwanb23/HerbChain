import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LineageItem = ({ item }) => {
  return (
    <View style={[styles.container, { borderLeftColor: item.borderColor }]}>
      <Text style={styles.productName}>{item.productName}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Icon name={item.sourceIcon} size={16} color="#16a34a" />
          <Text style={styles.detailText}>{item.source}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name={item.locationIcon} size={16} color="#dc2626" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    paddingLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  detailsContainer: {
    marginLeft: 16,
    marginTop: 8,
    rowGap: 4, // space-y-1
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8, // space-x-2
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
});

export default LineageItem;