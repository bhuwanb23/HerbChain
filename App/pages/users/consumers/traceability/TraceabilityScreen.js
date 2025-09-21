import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Header, JourneyMap, FarmerSpotlight, Timeline, Certifications } from '../components';
import { useHerbTraceability, useConsumerActions } from '../hooks';
import { COLORS, STYLES } from '../constants';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';

const TraceabilityScreen = ({ navigation, route }) => {
  const { t } = useGlobalTranslation();
  const batchId = route?.params?.batchId || 'HERB-ASH-001';
  const { herbData, loading, error } = useHerbTraceability(batchId);
  const { isSharing, handleShare, handleViewReport, handleBack } = useConsumerActions();

  if (loading) {
    return (
      <View style={STYLES.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.sage} />
          <Text style={styles.loadingText}>{t.consumer?.loadingTraceabilityData || 'Loading herb traceability data...'}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={STYLES.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t.consumer?.errorLoadingData || 'Error loading data'}: {error}</Text>
        </View>
      </View>
    );
  }

  if (!herbData) {
    return (
      <View style={STYLES.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t.consumer?.noDataFoundForBatch || 'No data found for batch'} {batchId}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={STYLES.container}>
      <Header
        title={herbData.name}
        batchId={herbData.batchId}
        status={herbData.status}
        onBack={() => handleBack(navigation)}
        onShare={handleShare}
        isSharing={isSharing}
      />
      
      <ScrollView style={STYLES.mainContent} showsVerticalScrollIndicator={false}>
        <JourneyMap
          from={herbData.journey?.from || 'Rajasthan, India'}
          to={herbData.journey?.to || 'Your Location'}
          title={herbData.journey?.title || 'Farm to You'}
        />

        <FarmerSpotlight farmer={herbData.farmer} />

        <Timeline timeline={herbData.timeline} />

        <Certifications certifications={herbData.certifications} />
      </ScrollView>

      <View style={STYLES.bottomAction}>
        <TouchableOpacity 
          style={styles.reportButton} 
          onPress={handleViewReport}
        >
          <Text style={styles.reportButtonText}>View Full Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  reportButton: {
    backgroundColor: COLORS.sage,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TraceabilityScreen;
