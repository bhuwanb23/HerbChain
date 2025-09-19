import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../../../constants/api';
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

      // TODO: Replace with real farmer_id from auth/profile context
      const farmer_id = 1;

      const url = `${API_BASE_URL}/api/v1/farmers/batches`;
      const payload = {
        farmer_id,
        species: formData.species,
        species_detected: aiDetection?.species,
        weight: formData.weight,
        harvestDate: formData.harvestDate,
        cultivationMethod: formData.cultivationMethod,
        notes: formData.notes,
        ai_model: aiDetection ? 'mock-ai' : undefined,
        ai_confidence: aiDetection?.confidence,
        geo_location: aiDetection?.coordinates,
        image_url: imageUri, // Include the image URI
      };
      console.log('[HerbRegister] POST', url, payload);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.log('[HerbRegister] Error response', response.status, text);
        let err;
        try { err = JSON.parse(text); } catch (_) { err = { error: text || 'Unknown error' }; }
        throw new Error(err.error || 'Failed to create batch');
      }

      const data = await response.json();
      console.log('[HerbRegister] Success response', data);
      setResult({ batch: data.batch, qr_code: data.qr_code });
      setCurrentStep(REGISTRATION_STEPS.COMPLETE);

    } catch (e) {
      console.log('[HerbRegister] Request failed', e);
      Alert.alert('Error', e.message || 'Failed to create batch');
    } finally {
      setIsProcessing(false);
    }
  }, [formData, aiDetection]);

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
