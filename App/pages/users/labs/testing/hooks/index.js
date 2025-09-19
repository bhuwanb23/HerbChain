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

  const fetchArchived = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/lab/lab_001/archived`);
      const json = await res.json();
      setArchived(Array.isArray(json.herbs) ? json.herbs : []);
      if (!selectedBatch && json.herbs && json.herbs[0]) {
        setSelectedBatch(json.herbs[0].batch_id);
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
  const handleBatchSelect = (batchId) => setSelectedBatch(batchId);
  const toggleOfflineMode = () => setIsOffline(v => !v);
  const handleTestResultChange = (key, value) => setTestResults(prev => ({ ...prev, [key]: value }));
  const handleFileUpload = (id, file) => setUploadedFiles(prev => ({ ...prev, [id]: file }));
  const handleFileRemove = (id) => setUploadedFiles(prev => { const c = { ...prev }; delete c[id]; return c; });
  const handleSaveOffline = () => setOfflineData(prev => ([...prev, { batchId: selectedBatch, data: testResults, files: uploadedFiles }]));

  const handleSubmitResults = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/herbs/${selectedBatch}/lab_report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: 'lab_001',
          test_type: 'general',
          results_summary: JSON.stringify(testResults),
          certification: false,
          quality_status: 'testing',
        })
      });
      const json = await res.json();
      if (!res.ok) {
        console.log('Failed to submit results', json);
        return;
      }
      setTestResults({});
      setUploadedFiles({});
      fetchReports(selectedBatch);
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
  };
}

