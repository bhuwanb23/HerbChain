import { useState, useMemo } from 'react';
import { MOCK_BATCHES, BATCH_FILTERS, HERB_FILTERS, LOCATION_FILTERS, STATUS_FILTERS } from '../constants';

export const useBatchFilters = () => {
  const [activeBatchFilter, setActiveBatchFilter] = useState(BATCH_FILTERS.ALL);
  const [activeHerbFilter, setActiveHerbFilter] = useState(HERB_FILTERS.TULSI);
  const [activeLocationFilter, setActiveLocationFilter] = useState(LOCATION_FILTERS.RAJASTHAN);
  const [activeStatusFilter, setActiveStatusFilter] = useState(STATUS_FILTERS.PENDING);

  const resetFilters = () => {
    setActiveBatchFilter(BATCH_FILTERS.ALL);
    setActiveHerbFilter(HERB_FILTERS.TULSI);
    setActiveLocationFilter(LOCATION_FILTERS.RAJASTHAN);
    setActiveStatusFilter(STATUS_FILTERS.PENDING);
  };

  return {
    activeBatchFilter,
    setActiveBatchFilter,
    activeHerbFilter,
    setActiveHerbFilter,
    activeLocationFilter,
    setActiveLocationFilter,
    activeStatusFilter,
    setActiveStatusFilter,
    resetFilters,
  };
};

export const useBatchData = () => {
  const [batches, setBatches] = useState(MOCK_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      // Apply filters based on current filter state
      return true; // For now, return all batches
    });
  }, [batches]);

  const getBatchById = (batchId) => {
    return batches.find(batch => batch.id === batchId);
  };

  const updateBatchStatus = (batchId, newStatus) => {
    setBatches(prevBatches =>
      prevBatches.map(batch =>
        batch.id === batchId ? { ...batch, status: newStatus } : batch
      )
    );
  };

  const addBatch = (newBatch) => {
    setBatches(prevBatches => [...prevBatches, newBatch]);
  };

  const removeBatch = (batchId) => {
    setBatches(prevBatches => prevBatches.filter(batch => batch.id !== batchId));
  };

  return {
    batches: filteredBatches,
    selectedBatch,
    setSelectedBatch,
    isLoading,
    setIsLoading,
    getBatchById,
    updateBatchStatus,
    addBatch,
    removeBatch,
  };
};

export const useBatchWorkflow = () => {
  const [currentStep, setCurrentStep] = useState('verification');
  const [workflowData, setWorkflowData] = useState({});

  const steps = ['verification', 'testing', 'compliance', 'delivery'];

  const goToStep = (step) => {
    if (steps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('verification');
    setWorkflowData({});
  };

  const updateWorkflowData = (data) => {
    setWorkflowData(prev => ({ ...prev, ...data }));
  };

  return {
    currentStep,
    setCurrentStep,
    workflowData,
    setWorkflowData,
    goToStep,
    nextStep,
    previousStep,
    resetWorkflow,
    updateWorkflowData,
    steps,
  };
};

export const useBatchActions = () => {
  const handleQRScan = () => {
    console.log('QR Scan initiated');
    // Implement QR scanning logic
  };

  const handleBatchIDEntry = () => {
    console.log('Batch ID entry initiated');
    // Implement manual batch ID entry
  };

  const handleStartVerification = (batchId) => {
    console.log(`Starting verification for batch: ${batchId}`);
    // Implement verification start logic
  };

  const handleContinueTesting = (batchId) => {
    console.log(`Continuing testing for batch: ${batchId}`);
    // Implement testing continuation logic
  };

  const handleMarkDelivered = (batchId) => {
    console.log(`Marking batch as delivered: ${batchId}`);
    // Implement delivery marking logic
  };

  const handleViewDetails = (batchId) => {
    console.log(`Viewing details for batch: ${batchId}`);
    // Implement details viewing logic
  };

  const handleDownloadReport = (batchId) => {
    console.log(`Downloading report for batch: ${batchId}`);
    // Implement report download logic
  };

  return {
    handleQRScan,
    handleBatchIDEntry,
    handleStartVerification,
    handleContinueTesting,
    handleMarkDelivered,
    handleViewDetails,
    handleDownloadReport,
  };
};
