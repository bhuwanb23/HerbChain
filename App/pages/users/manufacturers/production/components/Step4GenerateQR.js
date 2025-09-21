import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TraceabilitySummary from './TraceabilitySummary';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const Step4GenerateQR = ({
  qrCodeImageUrl,
  productId,
  traceabilitySummaryData,
  onCreateNewProduct,
}) => {
  const { t } = useGlobalTranslation();
  const handleDownloadQR = () => {
    Alert.alert('Download QR', 'Functionality to download QR code will be implemented here.');
  };

  const handleShareProductDetails = () => {
    Alert.alert('Share Product', 'Functionality to share product details will be implemented here.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.title}>{t.production?.generateProductQR || 'Generate Product QR'}</Text>
        <Text style={styles.subtitle}>{t.production?.qrCodeGenerated || 'QR code generated for product traceability'}</Text>

        <View style={styles.qrCodeSection}>
          <View style={styles.qrCodeWrapper}>
            <Image
              source={{ uri: qrCodeImageUrl }}
              style={styles.qrCodeImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.productIdText}>{t.production?.productId || 'Product ID'}: {productId}</Text>
        </View>

        <TraceabilitySummary summaryData={traceabilitySummaryData} />

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadQR}>
            <Icon name="download" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.production?.productQRCode || 'Download QR Code'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareProductDetails}>
            <Icon name="share" size={20} color="#4b5563" />
            <Text style={styles.shareButtonText}>{t.production?.productDetails || 'Share Product Details'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createNewButton} onPress={onCreateNewProduct}>
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.production?.createNewProduct || 'Create New Product'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Flex properties handled by parent
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24, // p-6
  },
  title: {
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    color: '#111827', // gray-900
    marginBottom: 8, // mb-2
  },
  subtitle: {
    fontSize: 14, // text-sm
    color: '#4b5563', // gray-600
    marginBottom: 24, // mb-6
  },
  qrCodeSection: {
    alignItems: 'center',
    marginBottom: 24, // mb-6
  },
  qrCodeWrapper: {
    width: 192, // w-48
    height: 192, // h-48
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // mb-4
  },
  qrCodeImage: {
    width: 160, // w-40
    height: 160, // h-40
  },
  productIdText: {
    fontSize: 14,
    color: '#4b5563', // gray-600
  },
  actionButtons: {
    rowGap: 12, // space-y-3
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669', // primary
    paddingVertical: 12,
    borderRadius: 8,
    columnGap: 8, // mr-2
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    paddingVertical: 12,
    borderRadius: 8,
    columnGap: 8, // mr-2
    backgroundColor: '#fff',
  },
  shareButtonText: {
    color: '#4b5563', // gray-700
    fontSize: 16,
    fontWeight: '500',
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981', // secondary
    paddingVertical: 12,
    borderRadius: 8,
    columnGap: 8, // mr-2
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Step4GenerateQR;