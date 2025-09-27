import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { REGISTRATION_STEPS } from '../constants';
import { API_BASE_URL } from '../../../../../constants/api';
import safeFetch from '../../../../../services/apiClient';

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

      // Prepare API request data
      const requestData = {
        farmer_id: 'farmer_001', // Default farmer for development
        species_name: formData.species,
        harvest_date: formData.harvestDate,
        location: aiDetection?.location || 'Current Location',
        weight_kg: parseFloat(formData.weight),
        image_url: imageUri,
        cultivation_method: formData.cultivationMethod,
        notes: formData.notes
      };

      console.log('[HerbRegister] Sending request:', requestData);
      const path = `/api/v1/herbs`;
      console.log('[HerbRegister] Fetch URL:', `${API_BASE_URL}${path}`);

      const response = await safeFetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('[HerbRegister] HTTP status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create herb batch');
      }

      const resultData = await response.json();
      console.log('[HerbRegister] API Response:', resultData);

      setResult({ 
        batch: resultData.herb, 
        qr_code: resultData.qr_code,
        ownership_transfer: resultData.ownership_transfer
      });
      setCurrentStep(REGISTRATION_STEPS.COMPLETE);
      setIsProcessing(false);

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
