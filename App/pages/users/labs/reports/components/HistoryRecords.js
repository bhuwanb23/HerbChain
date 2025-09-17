import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useReportsData, useReportsFilters, useReportsActions } from '../hooks';
import SearchFilters from './SearchFilters';
import ReportCard from './ReportCard';
import ExportShare from './ExportShare';

const HistoryRecords = ({ onRecordSelect }) => {
  const { reports } = useReportsData();
  const {
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    selectedDateRange,
    setSelectedDateRange,
    applyFilters,
  } = useReportsFilters();
  
  const {
    handleSearchArchive,
    handleViewReport,
    handleDownloadReport,
    handleShareReport,
    handleExportPDF,
    handleExportExcel,
    handleShareWithAYUSH,
  } = useReportsActions();

  const filteredReports = applyFilters(reports);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <SearchFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          onSearch={handleSearchArchive}
        />
        
        <View style={styles.section}>
          <View style={styles.recentReportsHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity 
              onPress={() => console.log('View All Reports')}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.spaceY3}>
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewReport={handleViewReport}
                onDownloadReport={handleDownloadReport}
                onShareReport={handleShareReport}
              />
            ))}
          </View>
        </View>

        <ExportShare 
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onShareWithAYUSH={handleShareWithAYUSH}
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
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  recentReportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  spaceY3: {
    gap: 12,
  },
});

export default HistoryRecords;
