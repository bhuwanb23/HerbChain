import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import OrderedHerbItem from './OrderedHerbItem';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderedHerbList = ({
  orderedHerbs,
  getStatusStyle,
  onItemPress,
  onScanQRCode, // Accept onScanQRCode prop
}) => {
  return (
    <View style={styles.container}>
      {orderedHerbs.length > 0 ? (
        <FlatList
          data={orderedHerbs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderedHerbItem
              herb={item}
              getStatusStyle={getStatusStyle}
              onPress={() => onItemPress(item)}
              onScanQRCode={onScanQRCode} // Pass onScanQRCode to OrderedHerbItem
            />
          )}
          contentContainerStyle={styles.herbListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyListContainer}>
          <Icon name="info-outline" size={40} color="#9ca3af" />
          <Text style={styles.emptyListText}>No herbs have been ordered yet.</Text>
          <TouchableOpacity style={styles.orderNowButton} onPress={() => {/* Handle navigation to available herbs here if needed */}}>
            <Text style={styles.orderNowButtonText}>Order Now</Text>
          </TouchableOpacity>
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
    marginBottom: 20,
  },
  orderNowButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  orderNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OrderedHerbList;