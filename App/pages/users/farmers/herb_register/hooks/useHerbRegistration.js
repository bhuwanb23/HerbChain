import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { REGISTRATION_STEPS } from '../constants';
import { BatchesAPI, SpeciesAPI } from '../../../../../services/apiClient';
import { useAuth } from '../../../../contexts/AuthContext';

/**
 * Batch registration flow — second_backend P3 contract.
 *
 * generateBatchId() resolves the species to species_id (via /species lookup,
 * falling back to species_code), then POSTs /api/v1/batches with the new
 * required payload. The response carries { batch } — the initial QR is born
 * with the batch (P5) and fetched separately via /batches/:id/qr.
 */
export const useHerbRegistration = () => {
  const { accessToken } = useAuth();
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

    // Simulate AI processing (on-device tflite pre-pass; server confirm is P4)
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
      setFormData((prev) => ({
        ...prev,
        species: (dynamic.species || 'basil').toLowerCase(),
        harvestDate: new Date().toISOString().split('T')[0],
      }));

      setCurrentStep(REGISTRATION_STEPS.MANUAL_ENTRY);
      setIsProcessing(false);
    }, 2000);
  }, []);

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const generateBatchId = useCallback(async () => {
    if (!formData.species || !formData.weight || !formData.harvestDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    if (!accessToken) {
      Alert.alert('Not signed in', 'Sign in as a farmer to register a batch.');
      return;
    }

    try {
      setIsProcessing(true);
      setResult(null);

      // Resolve the species to an id — /species accepts a code lookup.
      let speciesId = null;
      try {
        const sp = await SpeciesAPI.get(accessToken, formData.species.trim().toLowerCase());
        speciesId = sp.species?.id || null;
      } catch (_e) {
        speciesId = null; // fall back to species_code
      }

      const harvestIso = new Date(`${formData.harvestDate}T00:00:00.000Z`).toISOString();
      const weightNum = parseFloat(formData.weight);
      const coords = aiDetection?.coordinates
        ? String(aiDetection.coordinates).split(',').map((s) => parseFloat(s.trim()))
        : [];

      const payload = {
        ...(speciesId ? { species_id: speciesId } : { species_code: formData.species.trim().toLowerCase() }),
        quantity: weightNum,
        unit: 'kg',
        harvest_date: harvestIso,
        cultivation_type: (formData.cultivationMethod || 'organic').toLowerCase(),
        gps_lat: Number.isFinite(coords[0]) ? coords[0] : 0,
        gps_lng: Number.isFinite(coords[1]) ? coords[1] : 0,
        location: aiDetection?.location || 'Current Location',
        ...(formData.notes ? { attributes: { notes: formData.notes } } : {}),
      };

      const created = await BatchesAPI.create(accessToken, payload);
      const batch = created.batch;

      setResult({
        batch: {
          batch_id: batch.id,
          code: batch.code,
          species_name: batch.species?.common_name || formData.species,
          weight_kg: batch.weight_kg,
          harvest_date: batch.harvest_date,
          location: batch.location,
        },
        qr_code: null, // fetched via BatchesAPI.getQr after creation
        ownership_transfer: null,
      });
      setCurrentStep(REGISTRATION_STEPS.COMPLETE);
      setIsProcessing(false);
    } catch (e) {
      console.log('[HerbRegister] Request failed', e);
      Alert.alert('Error', e?.message || 'Failed to create batch');
      setIsProcessing(false);
    }
  }, [formData, aiDetection, imageUri, accessToken]);

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

export default useHerbRegistration;
