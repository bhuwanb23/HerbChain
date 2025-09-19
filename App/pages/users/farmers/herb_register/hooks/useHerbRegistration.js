import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { REGISTRATION_STEPS } from '../constants';

export const useHerbRegistration = () => {
  const [currentStep, setCurrentStep] = useState(REGISTRATION_STEPS.AI_RECOGNITION);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiDetection, setAiDetection] = useState(null);
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    harvestDate: '',
    cultivationMethod: '',
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  const handleCameraPress = useCallback(async (detected = null) => {
    setIsProcessing(true);
    
    // Store the image URI if provided
    if (detected?.image_uri) {
      setImageUri(detected.image_uri);
    }
    
    // Simulate AI processing
    setTimeout(() => {
      const nowTs = new Date().toLocaleString();
      const dynamic = detected || {};
      setAiDetection({
        species: dynamic.species || 'Basil',
        confidence: typeof dynamic.confidence === 'number' ? dynamic.confidence : 95,
        location: dynamic.location || 'Current Location',
        coordinates: dynamic.coordinates || '',
        timestamp: dynamic.timestamp || nowTs,
      });
      
      // Auto-fill form with detected data
      setFormData(prev => ({
        ...prev,
        species: (dynamic.species || 'basil').toLowerCase(),
        harvestDate: new Date().toISOString().split('T')[0],
      }));
      
      setCurrentStep(REGISTRATION_STEPS.MANUAL_ENTRY);
      setIsProcessing(false);
    }, 2000);
  }, []);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const generateBatchId = useCallback(async () => {
    if (!formData.species || !formData.weight || !formData.harvestDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      setResult(null);

      // Simulate API call with dummy data
      setTimeout(() => {
        const dummyBatch = {
          batch_id: `BATCH-${Date.now()}`,
          farmer_id: 1,
          species_entered: formData.species,
          species_detected: aiDetection?.species,
          weight_kg: parseFloat(formData.weight),
          harvest_date: formData.harvestDate,
          cultivation_method: formData.cultivationMethod,
          remarks: formData.notes,
          image_url: imageUri,
          geo_location: aiDetection?.coordinates,
          status: 'Registered',
          created_at: new Date().toISOString(),
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };
        
        setResult({ batch: dummyBatch, qr_code: dummyBatch.qr_code });
        setCurrentStep(REGISTRATION_STEPS.COMPLETE);
        setIsProcessing(false);
      }, 1500);

    } catch (e) {
      console.log('[HerbRegister] Request failed', e);
      Alert.alert('Error', e.message || 'Failed to create batch');
      setIsProcessing(false);
    }
  }, [formData, aiDetection, imageUri]);

  const resetForm = useCallback(() => {
    setCurrentStep(REGISTRATION_STEPS.AI_RECOGNITION);
    setAiDetection(null);
    setIsProcessing(false);
    setFormData({
      species: '',
      weight: '',
      harvestDate: '',
      cultivationMethod: '',
      notes: '',
    });
    setResult(null);
    setImageUri(null);
  }, []);

  return {
    currentStep,
    isProcessing,
    aiDetection,
    formData,
    result,
    handleCameraPress,
    updateFormData,
    generateBatchId,
    resetForm,
  };
};
