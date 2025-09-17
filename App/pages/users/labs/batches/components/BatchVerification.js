import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useBatchFilters, useBatchData, useBatchActions } from '../hooks';
import BatchTimeline from './BatchTimeline';
import QuickActions from './QuickActions';
import BatchFilter from './BatchFilter';
import BatchList from './BatchList';

const BatchVerification = ({ onBatchLoad }) => {
  const {
    activeBatchFilter,
    setActiveBatchFilter,
    activeHerbFilter,
    setActiveHerbFilter,
    activeLocationFilter,
    setActiveLocationFilter,
    activeStatusFilter,
    setActiveStatusFilter,
  } = useBatchFilters();

  const { batches } = useBatchData();

  const {
    handleQRScan,
    handleBatchIDEntry,
    handleStartVerification,
    handleContinueTesting,
    handleMarkDelivered,
    handleViewDetails,
    handleDownloadReport,
  } = useBatchActions();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <BatchTimeline currentStep="verification" progress={25} />
        
        <QuickActions 
          onQRScan={handleQRScan}
          onBatchIDEntry={handleBatchIDEntry}
        />
        
        <BatchFilter 
          activeBatchFilter={activeBatchFilter}
          setActiveBatchFilter={setActiveBatchFilter}
          activeHerbFilter={activeHerbFilter}
          setActiveHerbFilter={setActiveHerbFilter}
          activeLocationFilter={activeLocationFilter}
          setActiveLocationFilter={setActiveLocationFilter}
          activeStatusFilter={activeStatusFilter}
          setActiveStatusFilter={setActiveStatusFilter}
        />
        
        <BatchList 
          batches={batches}
          onStartVerification={handleStartVerification}
          onContinueTesting={handleContinueTesting}
          onMarkDelivered={handleMarkDelivered}
          onViewDetails={handleViewDetails}
          onDownloadReport={handleDownloadReport}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
});

export default BatchVerification;