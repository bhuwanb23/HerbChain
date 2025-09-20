import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../../constants/api';

export const useTesting = () => {
  const [currentTab, setCurrentTab] = useState('list');
  const [archived, setArchived] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [offlineData, setOfflineData] = useState([]);
  const [reportsByBatch, setReportsByBatch] = useState({});
  const [currentMode, setCurrentMode] = useState('list'); // 'list', 'upload', 'view'
  const [selectedReport, setSelectedReport] = useState(null);
  const [herbs_not_uploaded, setHerbsNotUploaded] = useState([]);
  const [herbs_with_reports, setHerbsWithReports] = useState([]);

  const fetchArchived = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/lab/lab_001/archived`);
      const json = await res.json();
      const allHerbs = Array.isArray(json.herbs) ? json.herbs : [];
      setArchived(allHerbs);

      const herbsWithReportsData = [];
      const herbsWithoutReportsData = [];

      for (const herb of allHerbs) {
        const reportsRes = await fetch(`${API_BASE_URL}/api/v1/herbs/${herb.batch_id}/lab_report`);
        const reportsJson = await reportsRes.json();
        const reports = Array.isArray(reportsJson.reports) ? reportsJson.reports : [];
        setReportsByBatch(prev => ({ ...prev, [herb.batch_id]: reports }));

        if (reports.length > 0) {
          herbsWithReportsData.push({ ...herb, reports });
        } else {
          herbsWithoutReportsData.push(herb);
        }
      }
      setHerbsWithReports(herbsWithReportsData);
      setHerbsNotUploaded(herbsWithoutReportsData);

      if (!selectedBatch && allHerbs.length > 0) {
        setSelectedBatch(allHerbs[0].batch_id);
      }
    } catch (e) {
      console.log('Failed to fetch archived for testing', e);
    }
  }, [selectedBatch]);

  const fetchReports = useCallback(async (batchId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/lab_report`);
      const json = await res.json();
      setReportsByBatch(prev => ({ ...prev, [batchId]: Array.isArray(json.reports) ? json.reports : [] }));
    } catch (e) {
      console.log('Failed to fetch reports', e);
    }
  }, []);

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
    fetchArchived(); // Refresh the lists
  };

  const toggleOfflineMode = () => setIsOffline(v => !v);
  const handleTestResultChange = (key, value) => setTestResults(prev => ({ ...prev, [key]: value }));
  const handleFileUpload = (id, file) => setUploadedFiles(prev => ({ ...prev, [id]: file }));
  const handleFileRemove = (id) => setUploadedFiles(prev => { const c = { ...prev }; delete c[id]; return c; });
  const handleSaveOffline = () => setOfflineData(prev => ([...prev, { batchId: selectedBatch, data: testResults, files: uploadedFiles }]));

  const handleSubmitResults = async () => {
    if (!selectedBatch) {
      console.error("No batch selected for submitting results.");
      return;
    }

    // Determine final quality status based on test results
    const isCertified = testResults.certification === true;
    const hasHeavyMetals = testResults.heavy_metals_present === true;
    const hasPesticides = testResults.pesticides_detected === true;

    let finalQualityStatus = 'testing'; // Default
    if (isCertified && !hasHeavyMetals && !hasPesticides) {
      finalQualityStatus = 'approved'; // Maps to 'certified'
    } else if (hasHeavyMetals || hasPesticides) {
      finalQualityStatus = 'rejected';
    } else if (testResults.certification === false) {
      finalQualityStatus = 'rejected';
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch}/lab_report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: 'lab_001',
          test_type: 'general',
          results_summary: testResults.results_summary || '',
          certification: isCertified,
          certification_level: testResults.certification_level || null,
          purity_percentage: parseFloat(testResults.purity_percentage) || null,
          moisture_content: parseFloat(testResults.moisture) || null,
          ash_content: parseFloat(testResults.ash_content) || null,
          heavy_metals_present: hasHeavyMetals,
          pesticides_detected: hasPesticides,
          active_compounds: testResults.active_compounds || null,
          potency_rating: testResults.potency_rating || null,
          notes: testResults.notes || '',
          recommendations: testResults.recommendations || '',
          quality_status: finalQualityStatus,
        })
      });
      const json = await res.json();
      if (!res.ok) {
        console.log('Failed to submit results', json);
        return;
      }
      setTestResults({});
      setUploadedFiles({});
      resetSelection(); // Reset selection after submission
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
    withoutReports: archived.filter(h => !reportsByBatch[h.batch_id] || reportsByBatch[h.batch_id].length === 0),
    withReports: archived.filter(h => reportsByBatch[h.batch_id] && reportsByBatch[h.batch_id].length > 0),
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
}

