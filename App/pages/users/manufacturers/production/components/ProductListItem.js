import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const ProductListItem = ({ product, onPress }) => {
  const { t } = useGlobalTranslation();
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Certified':
        return { backgroundColor: '#dcfce7', color: '#16a34a' }; // green-100, green-700
      case 'Pending Certification':
        return { backgroundColor: '#fef9c3', color: '#a16207' }; // yellow-100, yellow-700
      case 'Draft':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' }; // indigo-100, indigo-700
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' }; // gray-200, gray-600
    }
  };

  const statusStyle = getStatusStyle(product.status);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(product.id)}>
      <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      <View style={styles.detailsContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.batchId}>{t.production?.batch || 'Batch'} ID: {product.batchId}</Text>
        <View style={styles.footerRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{product.status}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Icon name="event" size={14} color="#6b7280" />
            <Text style={styles.dateText}>{product.dateCreated}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  batchId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ProductListItem;