import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinkedBatchItem from './LinkedBatchItem';

const ProductDetails = ({ product, onBackPress }) => {
  if (!product) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No product selected for details.</Text>
        <TouchableOpacity style={styles.backButtonEmpty} onPress={onBackPress}>
            <Text style={styles.backButtonText}>Back to List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Certified':
        return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'Pending Certification':
        return { backgroundColor: '#fef9c3', color: '#a16207' };
      case 'Draft':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' };
    }
  };

  const statusStyle = getStatusStyle(product.status);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Icon name="arrow-back" size={24} color="#4b5563" />
        <Text style={styles.backButtonText}>Back to Products</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{product.status}</Text>
          </View>
        </View>
        <Text style={styles.productId}>ID: {product.id}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product QR Code</Text>
          <View style={styles.qrCodeContainer}>
            {product.qrCodeImageUrl ? (
              <Image source={{ uri: product.qrCodeImageUrl }} style={styles.qrCodeImage} />
            ) : (
              <Text style={styles.noQrText}>QR Code not available</Text>
            )}
            <Text style={styles.batchIdText}>Master Batch ID: {product.batchId}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Created:</Text>
            <Text style={styles.detailValue}>{product.dateCreated}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing Method:</Text>
            <Text style={styles.detailValue}>{product.processingMethod}</Text>
          </View>
          {product.productionNotes && (
            <View style={styles.detailRowWide}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{product.productionNotes}</Text>
            </View>
          )}
        </View>

        {product.certifications && product.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.certificationsList}>
              {product.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Icon name="verified" size={16} color="#22c55e" />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {product.linkedBatches && product.linkedBatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Linked Raw Herb Batches</Text>
            <View style={styles.linkedBatchesList}>
              {product.linkedBatches.map((batch, index) => (
                <LinkedBatchItem key={index} herbName={batch.herbName} batchId={batch.batchId} />
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.printButton}>
          <Icon name="print" size={20} color="#fff" />
          <Text style={styles.printButtonText}>Print Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonEmpty: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  productId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  productDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  noQrText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  batchIdText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailRowWide: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  certificationsList: {
    rowGap: 8,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  certificationText: {
    fontSize: 14,
    color: '#4b5563',
  },
  linkedBatchesList: {
    rowGap: 8,
  },
  printButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    columnGap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetails;