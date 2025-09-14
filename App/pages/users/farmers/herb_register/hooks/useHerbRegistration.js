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

  const handleCameraPress = useCallback(async () => {
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setAiDetection({
        species: 'Basil',
        confidence: 95,
        location: 'Farm Plot A-12',
        coordinates: '40.7128°N 74.0060°W',
        timestamp: new Date().toLocaleString(),
      });
      
      // Auto-fill form with detected data
      setFormData(prev => ({
        ...prev,
        species: 'basil',
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

  const generateBatchId = useCallback(() => {
    if (!formData.species || !formData.weight || !formData.harvestDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const batchId = `HRB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    setCurrentStep(REGISTRATION_STEPS.COMPLETE);
    
    Alert.alert(
      'Batch Created Successfully!',
      `Your batch ID is: ${batchId}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form for next registration
            setCurrentStep(REGISTRATION_STEPS.AI_RECOGNITION);
            setAiDetection(null);
            setFormData({
              species: '',
              weight: '',
              harvestDate: '',
              cultivationMethod: '',
              notes: '',
            });
          },
        },
      ]
    );
  }, [formData]);

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
  }, []);

  return {
    currentStep,
    isProcessing,
    aiDetection,
    formData,
    handleCameraPress,
    updateFormData,
    generateBatchId,
    resetForm,
  };
};
