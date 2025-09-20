import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../../../../constants/api';

export const useConsumerAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHerbDetails = useCallback(async (batchId) => {
    if (!batchId) {
      setError('Batch ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Herb batch not found. Please check the QR code and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to fetch herb details. Please try again.');
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.herb) {
        throw new Error('Invalid response format from server.');
      }

      return {
        herb: data.herb,
        ownershipHistory: data.ownership_history || [],
        currentOwner: data.current_owner || null,
      };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching herb details:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateBatchId = useCallback((batchId) => {
    if (!batchId || typeof batchId !== 'string') {
      return false;
    }

    // Basic validation for herb batch ID format
    // Expected format: HERB-XXXXXXXX or similar
    const batchIdPattern = /^[A-Z0-9-_]+$/i;
    return batchIdPattern.test(batchId.trim());
  }, []);

  const parseQRData = useCallback((qrData) => {
    try {
      // Try to parse as JSON first
      if (qrData.startsWith('{')) {
        const parsed = JSON.parse(qrData);
        return parsed.batch_id || qrData;
      }
      
      // If not JSON, return as is
      return qrData.trim();
    } catch (error) {
      console.log('Error parsing QR data:', error);
      // Return original data if parsing fails
      return qrData.trim();
    }
  }, []);

  const showError = useCallback((message) => {
    Alert.alert(
      'Error',
      message,
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  const showSuccess = useCallback((message) => {
    Alert.alert(
      'Success',
      message,
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchHerbDetails,
    validateBatchId,
    parseQRData,
    showError,
    showSuccess,
    clearError,
  };
};
