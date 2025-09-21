import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../../../../components';
import { useConsumerAPI } from '../hooks/useConsumerAPI';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const TraceabilityScreen = ({ navigation, route }) => {
  const { t } = useGlobalTranslation();
  const batchId = route?.params?.batchId || 'HERB-ASH-001';
  const { fetchTraceabilityData, formatJourneyTimeline, loading, error } = useConsumerAPI();
  
  const [traceabilityData, setTraceabilityData] = useState(null);
  const [formattedTimeline, setFormattedTimeline] = useState([]);

  useEffect(() => {
    const loadTraceabilityData = async () => {
      try {
        console.log('🔍 Loading traceability data for batch:', batchId);
        const data = await fetchTraceabilityData(batchId);
        console.log('📊 Traceability data received:', data);
        if (data) {
          setTraceabilityData(data);
          setFormattedTimeline(formatJourneyTimeline(data.journeyTimeline));
          console.log('✅ Traceability data loaded successfully');
        }
      } catch (err) {
        console.error('❌ Error loading traceability data:', err);
      }
    };

    if (batchId) {
      loadTraceabilityData();
    }
  }, [batchId, fetchTraceabilityData, formatJourneyTimeline]);

  if (loading) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#87A96B" />
          <Text style={styles.loadingText}>{t.consumer?.loadingTraceabilityData || 'Loading herb traceability data...'}</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{t.consumer?.errorLoadingData || 'Error loading data'}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!traceabilityData) {
    return (
      <SafeAreaWrapper style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text" size={48} color="#6B7280" />
          <Text style={styles.errorText}>{t.consumer?.noDataFoundForBatch || 'No data found for batch'} {batchId}</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Traceability Report</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Herb Details Card */}
        <View style={styles.herbCard}>
          <View style={styles.herbHeader}>
            <Text style={styles.herbName}>{traceabilityData.herbDetails.species_name}</Text>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>{t.consumer?.verifiedAuthentic || 'Verified Authentic'}</Text>
            </View>
          </View>
          <Text style={styles.batchId}>Batch ID: {traceabilityData.batchId}</Text>
          <Text style={styles.harvestDate}>
            Harvested: {new Date(traceabilityData.herbDetails.harvest_date).toLocaleDateString()}
          </Text>
          <Text style={styles.weight}>Weight: {traceabilityData.herbDetails.weight_kg} kg</Text>
        </View>

        {/* Journey Summary */}
        {traceabilityData.journeySummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>{t.consumer?.journeyTimeline || 'Journey Summary'}</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{traceabilityData.journeySummary.total_days}</Text>
                <Text style={styles.summaryLabel}>Days</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{traceabilityData.totalTransfers}</Text>
                <Text style={styles.summaryLabel}>Transfers</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(traceabilityData.journeySummary.total_distance_km || 0)}
                </Text>
                <Text style={styles.summaryLabel}>km</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons 
                  name={traceabilityData.journeySummary.quality_certified ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={traceabilityData.journeySummary.quality_certified ? "#10B981" : "#EF4444"} 
                />
                <Text style={styles.summaryLabel}>Certified</Text>
              </View>
            </View>
          </View>
        )}

        {/* Journey Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>{t.consumer?.journeyTimeline || 'Journey Timeline'}</Text>
          {formattedTimeline.map((step, index) => (
            <View key={step.transfer_id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineIcon, { backgroundColor: step.statusColor }]} >
                  <Ionicons name={step.userIcon} size={20} color="#FFFFFF" />
                </View>
                {index < formattedTimeline.length - 1 && <View style={styles.timelineLine} />}
              </View>
              
              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineTitle}>{step.transfer_reason}</Text>
                  <Text style={styles.timelineDate}>{step.formattedDate}</Text>
                </View>
                
                {step.to_user && (
                  <View style={styles.userInfo}>
                    <Ionicons name={step.userIcon} size={16} color="#6B7280" />
                    <Text style={styles.userName}>{step.to_user.name}</Text>
                    <Text style={styles.userRole}>({step.to_user.role})</Text>
                  </View>
                )}
                
                <Text style={styles.timelineLocation}> {step.displayLocation}</Text>
                
                {step.notes && (
                  <Text style={styles.timelineNotes}>{step.notes}</Text>
                )}
                
                {step.transport_details && (
                  <View style={styles.transportInfo}>
                    <Text style={styles.transportTitle}> Transport Details</Text>
                    <Text style={styles.transportDetail}>
                      From: {step.transport_details.pickup_location}
                    </Text>
                    <Text style={styles.transportDetail}>
                      To: {step.transport_details.dropoff_location}
                    </Text>
                    {step.transportDuration && (
                      <Text style={styles.transportDetail}>
                        Duration: {step.transportDuration}
                      </Text>
                    )}
                  </View>
                )}
                
                {step.lab_reports && step.lab_reports.length > 0 && (
                  <View style={styles.labInfo}>
                    <Text style={styles.labTitle}> Lab Report</Text>
                    {step.lab_reports.map((report, idx) => (
                      <View key={report.report_id} style={styles.labReport}>
                        <Text style={styles.labDetail}>Test: {report.test_type}</Text>
                        <Text style={styles.labDetail}>
                          Purity: {report.purity_percentage}%
                        </Text>
                        <Text style={styles.labDetail}>
                          Status: {report.certification ? ' Certified' : ' Not Certified'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Farmer Spotlight */}
        {traceabilityData.farmerDetails && (
          <View style={styles.farmerCard}>
            <Text style={styles.sectionTitle}>{t.consumer?.farmerSpotlight || 'Farmer Spotlight'}</Text>
            <View style={styles.farmerInfo}>
              <View style={styles.farmerAvatar}>
                <Ionicons name="person" size={32} color="#87A96B" />
              </View>
              <View style={styles.farmerDetails}>
                <Text style={styles.farmerName}>{traceabilityData.farmerDetails.name}</Text>
                <Text style={styles.farmerRole}>{t.consumer?.generationFarmer || '3rd Generation Farmer'}</Text>
                <Text style={styles.farmerLocation}> {traceabilityData.farmerDetails.location}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>{t.consumer?.view || 'View Full Report'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#87A96B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  herbCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  herbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  herbName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  harvestDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  weight: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#87A96B',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timelineDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  timelineLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timelineNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  transportInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  transportDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  labInfo: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  labTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labReport: {
    marginBottom: 4,
  },
  labDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  farmerRole: {
    fontSize: 14,
    color: '#87A96B',
    marginBottom: 4,
  },
  farmerLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reportButton: {
    backgroundColor: '#87A96B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TraceabilityScreen;
