import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReportsHeader from './components/ReportsHeader';
import DateFilters from './components/DateFilters';
import ReportsSummaryCards from './components/ReportsSummaryCards';
import ProductionTrendsChart from './components/ProductionTrendsChart';
import ProductLineage from './components/ProductLineage';
import ComplianceDocuments from './components/ComplianceDocuments';
import GenerateReportButtons from './components/GenerateReportButtons';
import useReportsData from './hooks/useReportsData';

const ReportsPage = () => {
  const {
    selectedDateFilter,
    setSelectedDateFilter,
    currentDateRange,
    filteredSummaryCards,
    productionTrendsData,
    productLineageData,
    complianceDocuments,
    handleUploadDocument,
    handleDownloadDocument,
    generateReportOptions,
    handleGenerateReport,
  } = useReportsData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ReportsHeader />
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <DateFilters
          selectedDateFilter={selectedDateFilter}
          onSelectDateFilter={setSelectedDateFilter}
          currentDateRange={currentDateRange}
        />
        <ReportsSummaryCards summaryCardsData={filteredSummaryCards} />
        <ProductionTrendsChart monthlyProductionData={productionTrendsData} />
        <ProductLineage lineageData={productLineageData} />
        <ComplianceDocuments
          complianceDocumentsData={complianceDocuments}
          onUploadDocument={handleUploadDocument}
          onDownloadDocument={handleDownloadDocument}
        />
        <GenerateReportButtons
          generateOptions={generateReportOptions}
          onGenerateReport={handleGenerateReport}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24, // py-6
    rowGap: 24, // space-y-6
  },
});

export default ReportsPage;