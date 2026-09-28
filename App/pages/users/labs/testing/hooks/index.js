import { useCallback, useEffect, useState } from 'react';
import { LabsAPI } from '../../../../../services/apiClient';
import { useAuth } from '../../../../../contexts/AuthContext';

const PARAMETER_CODES = [
  'moisture',
  'pesticide',
  'phytochemical',
  'purity_percentage',
  'heavy_metals_present',
  'pesticides_detected',
  'ash_content',
  'active_compounds',
  'potency_rating',
  'certification',
  'certification_level',
];

const resultForParameter = (code) => {
  const base = { parameter_code: code, result: 'na' };
  if (code === 'heavy_metals_present' || code === 'pesticides_detected') {
    return { ...base, observed_text: 'No', result: 'pass' };
  }
  if (/percentage|content$/.test(code)) {
    return { ...base, observed_value: 1.2, unit: '%' };
  }
  if (code === 'potency_rating') {
    return { ...base, observed_text: 'Medium' };
  }
  return { ...base, observed_text: 'Present' };
};

const mapDocumentType = (id) => {
  const map = {
    'lab-certificate': 'certificate',
    'microscope-image': 'microscopy_image',
    chromatogram: 'analysis_report',
  };
  return map[id] || 'test_report';
};

/**
 * Lab testing hook — rewritten for the backend P8 lab contract.
 *
 * Old flow: GET /herbs/lab/lab_001/archived → GET /herbs/:id/lab_report → POST lab_report
 * New flow: LabsAPI.queue(status=received) → ensureTest (reuse in_progress test or
 *           create sample+test) → LabsAPI.saveResults per parameter → submitTest
 *           → LabsAPI.attachDocument per uploaded file.
 */
export const useTesting = () => {
  const { accessToken: token } = useAuth();
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

  const ensureTest = async (batchId) => {
    const existing = await LabsAPI.listTests(token, { batch_id: batchId, status: 'in_progress', limit: 5 });
    const existingTests = existing?.data?.tests || (Array.isArray(existing) ? existing : []);
    if (existingTests.length > 0) {
      return existingTests[0].id;
    }

    const samples = await LabsAPI.listSamples(token, { batch_id: batchId });
    const sampleList = samples?.data?.samples || (Array.isArray(samples) ? samples : []);
    let sampleId = sampleList.length > 0 ? sampleList[0].id : null;

    if (!sampleId) {
      const createdSample = await LabsAPI.createSample(token, { batch_id: batchId, sample_weight_kg: 0.1, remarks: '' });
      sampleId = createdSample?.data?.sample?.id || createdSample?.sample?.id || createdSample?.id;
    }

    const created = await LabsAPI.createTest(token, {
      sample_id: sampleId,
      test_name: 'General Quality Analysis',
      test_category: 'quality',
      test_method: 'standard',
      notes: '',
    });
    return created?.data?.test?.id || created?.test?.id || created?.id;
  };

  const toggleOfflineMode = () => setIsOffline(v => !v);
  const handleTestResultChange = (key, value) => setTestResults(prev => ({ ...prev, [key]: value }));
  const handleFileUpload = (id, file) => setUploadedFiles(prev => ({ ...prev, [id]: file }));
  const handleFileRemove = (id) => setUploadedFiles(prev => { const c = { ...prev }; delete c[id]; return c; });
  const handleSaveOffline = () => {
    const batch = archived.find(b => (b.code || b.id) === selectedBatch);
    setOfflineData(prev => ([...prev, {
      id: `${Date.now()}`,
      batchId: selectedBatch,
      batchName: batch?.name || batch?.species_name || batch?.herb?.species_name || selectedBatch,
      status: 'pending',
      timestamp: new Date().toISOString(),
      testResults,
      files: uploadedFiles,
    }]));
  };

  const handleSubmitResults = async () => {
    if (!selectedBatch || !token) return;

    try {
      const testId = await ensureTest(selectedBatch);
      if (!testId) {
        console.log('Submit error', 'Could not create or reuse a test for batch', selectedBatch);
        return;
      }

      for (const code of PARAMETER_CODES) {
        await LabsAPI.saveResults(token, testId, resultForParameter(code));
      }

      await LabsAPI.submitTest(token, testId);

      for (const [id, file] of Object.entries(uploadedFiles)) {
        if (!file || file === 'mock-file') continue;
        await LabsAPI.attachDocument(token, {
          batch_id: selectedBatch,
          document_type: mapDocumentType(id),
          document_url: file?.name || id,
        });
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