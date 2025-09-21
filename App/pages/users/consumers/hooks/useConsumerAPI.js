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
      console.log('🔍 Parsing QR data:', qrData);
      
      // Handle different QR code formats
      if (typeof qrData === 'string') {
        // Try to parse as JSON first
        if (qrData.startsWith('{') && qrData.endsWith('}')) {
          try {
            const parsed = JSON.parse(qrData);
            console.log('✅ Parsed as JSON:', parsed);
            return parsed.batch_id || qrData;
          } catch (jsonError) {
            console.log('❌ JSON parse failed, trying Python dict format');
            
            // Try to handle Python dictionary format
            // Convert Python dict format to JSON-like format
            let cleanData = qrData
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/True/g, 'true')  // Replace Python True with JSON true
              .replace(/False/g, 'false')  // Replace Python False with JSON false
              .replace(/None/g, 'null');  // Replace Python None with JSON null
            
            try {
              const parsed = JSON.parse(cleanData);
              console.log('✅ Parsed as Python dict:', parsed);
              return parsed.batch_id || qrData;
            } catch (dictError) {
              console.log('❌ Python dict parse also failed');
            }
          }
        }
        
        // Check if it's already a batch_id format
        if (qrData.match(/^HERB-[A-Z0-9]+$/i) || qrData.match(/^HERB_[A-Z0-9_]+$/i)) {
          console.log('✅ Direct batch_id format:', qrData);
          return qrData.trim();
        }
        
        // Try to extract batch_id from string using regex
        const batchIdMatch = qrData.match(/['"]?batch_id['"]?\s*:\s*['"]?([^'",\s}]+)['"]?/i);
        if (batchIdMatch) {
          console.log('✅ Extracted batch_id:', batchIdMatch[1]);
          return batchIdMatch[1];
        }
      }
      
      // If all parsing fails, return original data
      console.log('⚠️ Using original QR data as batch_id:', qrData);
      return qrData.toString().trim();
      
    } catch (error) {
      console.log('❌ Error parsing QR data:', error);
      // Return original data if parsing fails
      return qrData.toString().trim();
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

  const fetchTraceabilityData = useCallback(async (batchId) => {
    if (!batchId) {
      setError('Batch ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/traceability`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Herb batch not found or no traceability data available.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to fetch traceability data. Please try again.');
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.herb_details || !data.journey_timeline) {
        throw new Error('Invalid traceability data format from server.');
      }

      return {
        batchId: data.batch_id,
        herbDetails: data.herb_details,
        farmerDetails: data.farmer_details,
        journeyTimeline: data.journey_timeline,
        currentOwner: data.current_owner,
        totalTransfers: data.total_transfers,
        journeySummary: data.journey_summary
      };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching traceability data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const formatJourneyTimeline = useCallback((timeline) => {
    if (!timeline || !Array.isArray(timeline)) return [];

    return timeline.map(step => ({
      ...step,
      formattedDate: formatDate(step.transfer_date),
      userIcon: getUserIcon(step.to_user?.role),
      statusColor: getTransferStatusColor(step.transfer_reason),
      displayLocation: step.location || 'Location not specified',
      transportDuration: step.transport_details?.actual_duration 
        ? `${Math.round(step.transport_details.actual_duration / 60)} hours`
        : null
    }));
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }, []);

  const getUserIcon = useCallback((role) => {
    switch (role) {
      case 'farmer': return 'leaf';
      case 'transporter': return 'car';
      case 'lab': return 'flask';
      case 'manufacturer': return 'business';
      default: return 'person';
    }
  }, []);

  const getTransferStatusColor = useCallback((reason) => {
    switch (reason) {
      case 'Initial Creation': return '#10B981';
      case 'Lab Testing Request': return '#F59E0B';
      case 'Pickup': return '#3B82F6';
      case 'Delivery to Lab': return '#8B5CF6';
      case 'Lab Testing Approved': return '#10B981';
      case 'Lab Testing Rejected': return '#EF4444';
      case 'Manufacturer Order': return '#F97316';
      case 'Delivery to Manufacturer': return '#06B6D4';
      default: return '#6B7280';
    }
  }, []);

  return {
    loading,
    error,
    fetchHerbDetails,
    fetchTraceabilityData,
    validateBatchId,
    parseQRData,
    formatJourneyTimeline,
    showError,
    showSuccess,
    clearError,
  };
};
