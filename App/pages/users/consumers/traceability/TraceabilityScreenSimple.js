import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const TraceabilityScreenSimple = ({ navigation, route }) => {
  const { t } = useGlobalTranslation();
  const batchId = route?.params?.batchId || 'HERB-ASH-001';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="share-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.titleSection}>
        <Text style={styles.title}>Ashwagandha</Text>
        <Text style={styles.batchId}>{t.consumer?.batch || 'Batch'} ID: {batchId}</Text>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#87A96B" />
          <Text style={styles.statusText}>{t.consumer?.verifiedAuthentic || 'Verified Authentic'}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Journey Map */}
        <View style={styles.journeyMap}>
          <View style={styles.mapContainer}>
            <View style={styles.startPoint} />
            <View style={styles.endPoint} />
            <View style={styles.routeIcon}>
              <Ionicons name="map" size={24} color="#87A96B" />
            </View>
          </View>
          <View style={styles.journeyText}>
            <Text style={styles.journeyTitle}>{t.consumer?.farmToYou || 'Farm to You'}</Text>
            <Text style={styles.journeyRoute}>Rajasthan, India → Your Location</Text>
          </View>
        </View>

        {/* Farmer Spotlight */}
        <View style={styles.farmerCard}>
          <Text style={styles.cardTitle}>{t.consumer?.farmerSpotlight || 'Farmer Spotlight'}</Text>
          <View style={styles.farmerInfo}>
            <View style={styles.avatar} />
            <View style={styles.farmerDetails}>
              <Text style={styles.farmerName}>Rajesh Kumar</Text>
              <Text style={styles.farmerTitle}>{t.consumer?.generationFarmer || '3rd Generation Farmer'}</Text>
              <Text style={styles.farmerDescription}>
                {t.consumer?.organicFarmingSpecialist || 'Organic farming specialist with 20+ years experience growing premium Ashwagandha in Rajasthan\'s fertile soil.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>{t.consumer?.journeyTimeline || 'The Story of Your Herb'}</Text>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t.consumer?.harvested || 'Harvested'}</Text>
              <Text style={styles.timelineDate}>October 15, 2024</Text>
              <Text style={styles.timelineDescription}>
                {t.consumer?.handPickedOptimalMaturity || 'Hand-picked at optimal maturity during early morning hours to preserve potency.'}
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="search-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t.consumer?.testedForPurity || 'Tested for Purity'}</Text>
              <Text style={styles.timelineDate}>October 16, 2024</Text>
              <Text style={styles.timelineDescription}>
                {t.consumer?.labTestedHeavyMetals || 'Laboratory tested for heavy metals, pesticides, and withanolide content. 99.8% purity confirmed.'}
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t.consumer?.packaged || 'Packaged'}</Text>
              <Text style={styles.timelineDate}>October 18, 2024</Text>
              <Text style={styles.timelineDescription}>
                {t.consumer?.sealedAirtightUV || 'Sealed in airtight, UV-protected packaging to maintain freshness and potency.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.certificationsSection}>
          <Text style={styles.sectionTitle}>{t.consumer?.certified || 'Certifications'}</Text>
          <View style={styles.certGrid}>
            <View style={styles.certItem}>
              <Ionicons name="leaf-outline" size={32} color="#87A96B" />
              <Text style={styles.certText}>{t.consumer?.organicCertified || 'Organic Certified'}</Text>
            </View>
            <View style={styles.certItem}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#87A96B" />
              <Text style={styles.certText}>{t.consumer?.gmpCompliant || 'GMP Compliant'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>{t.consumer?.view || 'View Full Report'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconButton: {
    padding: 8,
  },
  titleSection: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  batchId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A8C68620',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#87A96B',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  journeyMap: {
    backgroundColor: '#F5F1E8',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  mapContainer: {
    height: 128,
    position: 'relative',
    marginBottom: 16,
  },
  startPoint: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 12,
    height: 12,
    backgroundColor: '#87A96B',
    borderRadius: 6,
  },
  endPoint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 12,
    height: 12,
    backgroundColor: '#6B8E3A',
    borderRadius: 6,
  },
  routeIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  journeyText: {
    alignItems: 'center',
  },
  journeyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B7355',
    marginBottom: 4,
  },
  journeyRoute: {
    fontSize: 12,
    color: '#4B5563',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  farmerTitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  farmerDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  timelineSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  timelineIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#87A96B',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  timelineDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  certificationsSection: {
    marginBottom: 32,
  },
  certGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  certItem: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  certText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 8,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  reportButton: {
    backgroundColor: '#87A96B',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TraceabilityScreenSimple;
