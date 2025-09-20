import { useState, useMemo } from 'react';
import { HERB_OPTIONS, PROCESSING_METHODS, TRACEABILITY_SUMMARY_DATA, QR_CODE_IMAGE_URL, PRODUCT_ID_MOCK, PRODUCTION_STEPS, PRODUCT_LIST_MOCK, PRODUCT_DETAILS_MOCK } from '../constants/productionConstants';

const useProductCreationData = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedHerbs, setSelectedHerbs] = useState([]);
  const [herbProportions, setHerbProportions] = useState({});
  const [processingMethod, setProcessingMethod] = useState(PROCESSING_METHODS[0]);
  const [processingNotes, setProcessingNotes] = useState('');
  const [linkedBatches, setLinkedBatches] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'details'
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);

  const startNewProductCreation = () => {
    setCurrentView('create');
    setCurrentStep(1);
    setSelectedHerbs([]);
    setHerbProportions({});
    setProcessingMethod(PROCESSING_METHODS[0]);
    setProcessingNotes('');
    setLinkedBatches([]);
  };

  const viewProductDetails = (productId) => {
    setSelectedProductForDetails(PRODUCT_DETAILS_MOCK[productId]);
    setCurrentView('details');
  };

  const backToProductList = () => {
    setCurrentView('list');
    setSelectedProductForDetails(null);
    // Also reset creation form if needed, though handleCreateNewProduct does that.
    // handleCreateNewProduct(); // Can be called here if navigating from creation back to list requires a full reset
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedHerbs.length === 0) {
        alert('Please select at least one herb.');
        return;
      }
      // Initialize proportions for selected herbs
      const initialProportions = {};
      selectedHerbs.forEach(herb => {
        initialProportions[herb.id] = 25; // Default to 25%
      });
      setHerbProportions(initialProportions);
    }
    if (currentStep < PRODUCTION_STEPS.length) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const handleHerbSelection = (herbId, isSelected) => {
    if (isSelected) {
      setSelectedHerbs(prev => [...prev, HERB_OPTIONS.find(herb => herb.id === herbId)]);
    } else {
      setSelectedHerbs(prev => prev.filter(herb => herb.id !== herbId));
      // Remove from proportions if deselected
      setHerbProportions(prev => {
        const newProportions = { ...prev };
        delete newProportions[herbId];
        return newProportions;
      });
    }
  };

  const handleProportionChange = (herbId, value) => {
    setHerbProportions(prev => ({
      ...prev,
      [herbId]: Math.max(1, Math.min(100, parseInt(value || '0', 10))), // Ensure value is between 1 and 100
    }));
  };

  const handleCreateNewProduct = () => {
    setCurrentStep(1);
    setSelectedHerbs([]);
    setHerbProportions({});
    setProcessingMethod(PROCESSING_METHODS[0]);
    setProcessingNotes('');
    setLinkedBatches([]);
    setCurrentView('list'); // Go back to product list after creating a new product
  };

  // Mock linking batches based on selected herbs
  const generateLinkedBatches = useMemo(() => {
    return selectedHerbs.map(herb => ({
      herbName: herb.name,
      batchId: herb.batch,
    }));
  }, [selectedHerbs]);

  return {
    currentStep,
    handleNextStep,
    handlePreviousStep,
    selectedHerbs,
    handleHerbSelection,
    herbProportions,
    handleProportionChange,
    processingMethods: PROCESSING_METHODS,
    processingMethod,
    setProcessingMethod,
    processingNotes,
    setProcessingNotes,
    linkedBatches: generateLinkedBatches,
    traceabilitySummaryData: TRACEABILITY_SUMMARY_DATA,
    qrCodeImageUrl: QR_CODE_IMAGE_URL,
    productId: PRODUCT_ID_MOCK,
    handleCreateNewProduct,
    productionSteps: PRODUCTION_STEPS,
    currentView,
    startNewProductCreation,
    viewProductDetails,
    backToProductList,
    selectedProductForDetails,
    productList: PRODUCT_LIST_MOCK, // Provide the mock product list
  };
};

export default useProductCreationData;