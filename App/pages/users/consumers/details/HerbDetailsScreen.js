import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { Ionicons } from '@expo/vector-icons';
import HerbDetailsDisplay from '../components/HerbDetailsDisplay';

const HerbDetailsScreen = ({ navigation, route }) => {
  const { herbData, ownershipHistory, currentOwner, batchId } = route.params || {};

  const handleShare = async () => {
    try {
      const shareContent = {
        title: 'Herb Traceability Information',
        message: `Check out the traceability information for herb batch ${batchId || 'N/A'}:\n\n` +
                `Species: ${herbData?.species_name || 'N/A'}\n` +
                `Weight: ${herbData?.weight_kg || 'N/A'} kg\n` +
                `Harvest Date: ${herbData?.harvest_date || 'N/A'}\n` +
                `Location: ${herbData?.location || 'N/A'}\n` +
                `Status: ${herbData?.quality_status || 'N/A'}\n\n` +
                `Verified through HerbChain blockchain traceability system.`,
        url: `https://herbchain.app/trace/${batchId}`,
      };

      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleScanAnother = () => {
    navigation.navigate('QRScanScreen');
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Herb Details</Text>
          {batchId && (
            <Text style={styles.headerSubtitle}>Batch: {batchId}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#87A96B" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <HerbDetailsDisplay
          herbData={herbData}
          ownershipHistory={ownershipHistory}
          currentOwner={currentOwner}
          onShare={handleShare}
        />
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.scanAnotherButton} onPress={handleScanAnother}>
          <Ionicons name="qr-code" size={20} color="#87A96B" />
          <Text style={styles.scanAnotherButtonText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  bottomActions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#87A96B',
    backgroundColor: '#FFFFFF',
  },
  scanAnotherButtonText: {
    color: '#87A96B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HerbDetailsScreen;
