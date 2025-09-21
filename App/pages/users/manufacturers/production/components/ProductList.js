import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import ProductListItem from './ProductListItem';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const ProductList = ({ products, onViewDetails }) => {
  const { t } = useGlobalTranslation();
  return (
    <View style={styles.container}>
      {products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductListItem
              product={item}
              onPress={onViewDetails}
            />
          )}
          contentContainerStyle={styles.productListContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyListContainer}>
          <Icon name="info-outline" size={40} color="#9ca3af" />
          <Text style={styles.emptyListText}>{t.production?.noProductsCreated || 'No products created yet.'}</Text>
          <Text style={styles.emptyListSubText}>{t.production?.tapToCreateProduct || "Tap the '+' button to create a new product."}</Text>
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
  productListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    marginBottom: 5,
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default ProductList;