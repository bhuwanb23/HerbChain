import { useState, useMemo } from 'react';
import { DATE_FILTER_OPTIONS, REPORT_SUMMARY_CARDS, PRODUCTION_TRENDS_DATA, PRODUCT_LINEAGE_DATA, COMPLIANCE_DOCUMENTS_DATA, GENERATE_REPORT_OPTIONS } from '../constants/reportsConstants';

const useReportsData = () => {
  const [selectedDateFilter, setSelectedDateFilter] = useState('weekly');
  const [currentDateRange, setCurrentDateRange] = useState('Dec 11 - Dec 17, 2024'); // Mocked for now
  const [complianceDocuments, setComplianceDocuments] = useState(COMPLIANCE_DOCUMENTS_DATA);

  const handleUploadDocument = () => {
    // Placeholder for document upload logic
    alert('Upload document functionality will be implemented here.');
  };

  const handleDownloadDocument = (docId) => {
    // Placeholder for document download logic
    const doc = complianceDocuments.find(d => d.id === docId);
    alert(`Downloading ${doc.name} (ID: ${docId})`);
  };

  const handleGenerateReport = (reportType) => {
    // Placeholder for report generation logic
    alert(`Generating ${reportType} report.`);
  };

  // Memoize filtered data if needed (e.g., if there were dynamic filters for reports)
  const filteredSummaryCards = useMemo(() => {
    // For now, return all cards. Logic to filter by date range would go here.
    return REPORT_SUMMARY_CARDS;
  }, [selectedDateFilter]);

  return {
    selectedDateFilter,
    setSelectedDateFilter,
    currentDateRange,
    filteredSummaryCards,
    productionTrendsData: PRODUCTION_TRENDS_DATA,
    productLineageData: PRODUCT_LINEAGE_DATA,
    complianceDocuments,
    handleUploadDocument,
    handleDownloadDocument,
    generateReportOptions: GENERATE_REPORT_OPTIONS,
    handleGenerateReport,
  };
};

export default useReportsData;