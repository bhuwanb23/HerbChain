import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, DocumentsAPI, ReportsAPI } from '../../../../../services/apiClient';
import { useAuth } from '../../../../../contexts/AuthContext';
import { DATE_FILTER_OPTIONS, REPORT_SUMMARY_CARDS, PRODUCTION_TRENDS_DATA, PRODUCT_LINEAGE_DATA, COMPLIANCE_DOCUMENTS_DATA, GENERATE_REPORT_OPTIONS } from '../constants/reportsConstants';

const formatRelativeDate = (isoString) => {
  if (!isoString) return 'Recently';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString();
};

const documentFileType = (mimeType) => {
  const mime = (mimeType || '');
  if (mime.includes('pdf')) return 'pdf';
  if (/spreadsheet|excel|officedocument\.spreadsheetml/.test(mime) || /\.(xlsx?|csv)$/i.test(mime)) return 'excel';
  return 'document';
};

const documentIcon = (mimeType) => {
  const fileType = documentFileType(mimeType);
  if (fileType === 'pdf') return 'picture_as_pdf';
  return 'description';
};

const useReportsData = () => {
  const { accessToken: token } = useAuth();
  const [selectedDateFilter, setSelectedDateFilter] = useState('weekly');
  const [currentDateRange, setCurrentDateRange] = useState('Dec 11 - Dec 17, 2024');
  const [complianceDocuments, setComplianceDocuments] = useState(COMPLIANCE_DOCUMENTS_DATA);

  const loadComplianceDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/documents?category=compliance&limit=50', { token });
      const documents = (data && data.documents) || [];
      if (!documents.length) {
        setComplianceDocuments(COMPLIANCE_DOCUMENTS_DATA);
        return;
      }
      setComplianceDocuments(
        documents.map((doc) => ({
          id: doc.id,
          name: doc.file_name || doc.name || 'Untitled Document',
          uploaded: formatRelativeDate(doc.created_at),
          icon: documentIcon(doc.mime_type),
          fileType: documentFileType(doc.mime_type),
        })),
      );
    } catch (error) {
      setComplianceDocuments(COMPLIANCE_DOCUMENTS_DATA);
    }
  }, [token]);

  useEffect(() => {
    loadComplianceDocuments();
  }, [loadComplianceDocuments]);

  const handleUploadDocument = useCallback(
    async (file) => {
      if (!file) {
        alert('Select a document to upload.');
        return;
      }
      try {
        const result = await DocumentsAPI.upload(token, file, { category: 'compliance' });
        alert(`Document uploaded: ${(result && result.document && result.document.file_name) || 'Success'}`);
        loadComplianceDocuments();
      } catch (error) {
        alert('Failed to upload document. Please try again.');
      }
    },
    [token, loadComplianceDocuments],
  );

  const handleDownloadDocument = useCallback(
    async (docId) => {
      try {
        const { data } = await api.get(`/api/v1/documents/${docId}/metadata`, { token });
        const doc = (data && data.document) || {};
        alert(`Downloading ${doc.file_name || 'document'} (ID: ${docId})`);
      } catch (error) {
        const existing = complianceDocuments.find((d) => d.id === docId);
        alert(`Downloading ${existing ? existing.name : 'document'} (ID: ${docId})`);
      }
    },
    [token, complianceDocuments],
  );

  const handleGenerateReport = useCallback(
    async (reportType) => {
      if (!reportType) return;
      try {
        const result = await ReportsAPI.generate(token, { report_type: reportType });
        alert(`Report "${reportType}" generated successfully.`);
      } catch (error) {
        alert('Failed to generate report. Please try again.');
      }
    },
    [token],
  );

  const filteredSummaryCards = useMemo(() => {
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