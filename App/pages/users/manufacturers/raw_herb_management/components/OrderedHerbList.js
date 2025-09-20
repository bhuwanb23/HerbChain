import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import OrderedHerbItem from './OrderedHerbItem';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OrderedHerbList = ({
  orderedHerbs,
  getStatusStyle,
  onScanQRCode,
  onItemPress,
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
              onPress={() => onItemPress(item)} // Pass item to onPress
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
      <TouchableOpacity style={styles.scanQRButtonFixed} onPress={onScanQRCode}>
        <Icon name="qr-code-scanner" size={24} color="#fff" />
        <Text style={styles.scanQRButtonTextFixed}>Scan QR Code</Text>
      </TouchableOpacity>
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
    paddingBottom: 80, // Adjust padding to prevent button overlap
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
  scanQRButtonFixed: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669', // primary
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    columnGap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanQRButtonTextFixed: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OrderedHerbList;