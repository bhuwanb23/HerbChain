import { useCallback, useEffect, useState } from 'react';
import { LabsAPI } from '../../../../../services/apiClient';

/**
 * Lab testing hook — rewritten for the backend P8 lab contract.
 *
 * Old flow: GET /herbs/lab/lab_001/archived → GET /herbs/:id/lab_report → POST lab_report
 * New flow: LabsAPI.queue(status=received) → LabsAPI.listTests → LabsAPI.saveResults → submitTest
 */
export const useTesting = (token) => {
  const [currentTab, setCurrentTab] = useState('list');
  const [archived, setArchived] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [offlineData, setOfflineData] = useState([]);
  const [reportsByBatch, setReportsByBatch] = useState({});
  const [currentMode, setCurrentMode] = useState('list');
  const [selectedReport, setSelectedReport] = useState(null);
  const [herbs_not_uploaded, setHerbsNotUploaded] = useState([]);
  const [herbs_with_reports, setHerbsWithReports] = useState([]);

  const fetchArchived = useCallback(async () => {
    if (!token) return;
    try {
      const data = await LabsAPI.queue(token, { status: 'received' });
      const allHerbs = Array.isArray(data) ? data : data?.batches || [];
      setArchived(allHerbs);

      const withReports = [];
      const withoutReports = [];

      for (const herb of allHerbs) {
        const batchId = herb.code || herb.id;
        try {
          const certs = await LabsAPI.listCertificates(token, batchId);
          const reports = Array.isArray(certs) ? certs : certs?.certificates || [];
          setReportsByBatch(prev => ({ ...prev, [batchId]: reports }));
          if (reports.length > 0) {
            withReports.push({ ...herb, reports });
          } else {
            withoutReports.push(herb);
          }
        } catch {
          withoutReports.push(herb);
        }
      }
      setHerbsWithReports(withReports);
      setHerbsNotUploaded(withoutReports);

      if (!selectedBatch && allHerbs.length > 0) {
        setSelectedBatch(allHerbs[0].code || allHerbs[0].id);
      }
    } catch (e) {
      console.log('Failed to fetch archived for testing', e);
    }
  }, [token, selectedBatch]);

  const fetchReports = useCallback(async (batchId) => {
    if (!token) return;
    try {
      const certs = await LabsAPI.listCertificates(token, batchId);
      setReportsByBatch(prev => ({
        ...prev,
        [batchId]: Array.isArray(certs) ? certs : certs?.certificates || [],
      }));
    } catch (e) {
      console.log('Failed to fetch reports', e);
    }
  }, [token]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);
  useEffect(() => { if (selectedBatch) fetchReports(selectedBatch); }, [selectedBatch, fetchReports]);

  const handleTabChange = (tab) => setCurrentTab(tab);

  const handleBatchSelect = (batchId, mode) => {
    setSelectedBatch(batchId);
    setCurrentMode(mode);
    setTestResults({});
    setUploadedFiles({});
    if (mode === 'view') {
      const reports = reportsByBatch[batchId];
      setSelectedReport(reports && reports.length > 0 ? reports[0] : null);
    }
  };

  const resetSelection = () => {
    setSelectedBatch(null);
    setCurrentMode('list');
    setSelectedReport(null);
    setTestResults({});
    setUploadedFiles({});
    fetchArchived();
  };

  const toggleOfflineMode = () => setIsOffline(v => !v);
  const handleTestResultChange = (key, value) => setTestResults(prev => ({ ...prev, [key]: value }));
  const handleFileUpload = (id, file) => setUploadedFiles(prev => ({ ...prev, [id]: file }));
  const handleFileRemove = (id) => setUploadedFiles(prev => { const c = { ...prev }; delete c[id]; return c; });
  const handleSaveOffline = () => setOfflineData(prev => ([...prev, { batchId: selectedBatch, data: testResults, files: uploadedFiles }]));

  const handleSubmitResults = async () => {
    if (!selectedBatch || !token) return;

    const isCertified = testResults.certification === true;
    const hasHeavyMetals = testResults.heavy_metals_present === true;
    const hasPesticides = testResults.pesticides_detected === true;

    let finalQualityStatus = 'testing';
    if (isCertified && !hasHeavyMetals && !hasPesticides) {
      finalQualityStatus = 'approved';
    } else if (hasHeavyMetals || hasPesticides || testResults.certification === false) {
      finalQualityStatus = 'rejected';
    }

    try {
      // Step 1: create a test record
      const test = await LabsAPI.createTest(token, {
        batch_id: selectedBatch,
        test_type: testResults.test_type || 'general',
        sample_id: testResults.sample_id || undefined,
      });

      const testId = test?.id || test?.test?.id;

      // Step 2: save results
      if (testId) {
        await LabsAPI.saveResults(token, testId, {
          purity_percentage: parseFloat(testResults.purity_percentage) || null,
          moisture_content: parseFloat(testResults.moisture) || null,
          ash_content: parseFloat(testResults.ash_content) || null,
          heavy_metals_present: hasHeavyMetals,
          pesticides_detected: hasPesticides,
          active_compounds: testResults.active_compounds || null,
          potency_rating: testResults.potency_rating || null,
          notes: testResults.notes || '',
          recommendations: testResults.recommendations || '',
        });

        // Step 3: submit
        await LabsAPI.submitTest(token, testId);
      }

      setTestResults({});
      setUploadedFiles({});
      resetSelection();
    } catch (e) {
      console.log('Submit error', e);
    }
  };

  const handleSyncOfflineData = () => {};
  const handleRetrySync = () => {};
  const handleDeleteOfflineEntry = () => {};
  const handleSyncAll = () => {};

  return {
    currentTab,
    archived,
    withoutReports: archived.filter(h => !reportsByBatch[h.code || h.id] || reportsByBatch[h.code || h.id].length === 0),
    withReports: archived.filter(h => reportsByBatch[h.code || h.id] && reportsByBatch[h.code || h.id].length > 0),
    selectedBatch,
    isOffline,
    testResults,
    uploadedFiles,
    offlineData,
    reportsByBatch,
    handleTabChange,
    handleBatchSelect,
    toggleOfflineMode,
    handleTestResultChange,
    handleFileUpload,
    handleFileRemove,
    handleSaveOffline,
    handleSubmitResults,
    handleSyncOfflineData,
    handleRetrySync,
    handleDeleteOfflineEntry,
    handleSyncAll,
    herbs_not_uploaded,
    herbs_with_reports,
    currentMode,
    selectedReport,
    resetSelection,
  };
};
