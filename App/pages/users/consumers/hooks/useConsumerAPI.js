import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { BatchesAPI, VerifyAPI, TransfersAPI } from '../../../../services/apiClient';

/**
 * Consumer API hook — rewritten for the backend contract.
 *
 * Consumer verification is PUBLIC (no auth) via VerifyAPI.
 * Batch detail + ownership history require auth via BatchesAPI/TransfersAPI.
 */
export const useConsumerAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch batch details by batch ID (requires auth).
   */
  const fetchHerbDetails = useCallback(async (batchId, token) => {
    if (!batchId) {
      setError('Batch ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await BatchesAPI.get(token, batchId);
      if (!data) {
        throw new Error('Batch not found. Please check the QR code and try again.');
      }

      return {
        herb: data.batch || data,
        ownershipHistory: data.ownership_history || [],
        currentOwner: data.current_holder || null,
      };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateBatchId = useCallback((batchId) => {
    if (!batchId || typeof batchId !== 'string') return false;
    return /^[A-Z0-9-_]+$/i.test(batchId.trim());
  }, []);

  const parseQRData = useCallback((qrData) => {
    try {
      if (typeof qrData === 'string') {
        if (qrData.startsWith('{') && qrData.endsWith('}')) {
          try {
            const parsed = JSON.parse(qrData);
            return parsed.token || parsed.batch_id || qrData;
          } catch (_) { /* fall through */ }
        }
        if (qrData.match(/batch_id/i)) {
          const m = qrData.match(/batch_id['"]?\s*:\s*['"]?([^'",\s}]+)/i);
          if (m) return m[1];
        }
      }
      return qrData.toString().trim();
    } catch {
      return qrData.toString().trim();
    }
  }, []);

  const showError = useCallback((message) => {
    Alert.alert('Error', message, [{ text: 'OK', style: 'default' }]);
  }, []);

  const showSuccess = useCallback((message) => {
    Alert.alert('Success', message, [{ text: 'OK', style: 'default' }]);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch traceability data — uses batch history endpoint.
   */
  const fetchTraceabilityData = useCallback(async (batchId, token) => {
    if (!batchId) {
      setError('Batch ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await BatchesAPI.history(token, batchId);

      return {
        batchId,
        herbDetails: data?.batch || data,
        farmerDetails: data?.farmer || null,
        journeyTimeline: data?.events || data?.timeline || [],
        currentOwner: data?.current_holder || null,
        totalTransfers: data?.total_transfers || 0,
        journeySummary: data?.journey_summary || null,
      };
    } catch (err) {
      setError(err.message || 'Failed to fetch traceability data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const formatJourneyTimeline = useCallback((timeline) => {
    if (!timeline || !Array.isArray(timeline)) return [];
    return timeline.map(step => ({
      ...step,
      formattedDate: formatDate(step.created_at || step.transfer_date),
      userIcon: getUserIcon(step.actor_role || step.to_user?.role),
      statusColor: getTransferStatusColor(step.event_type || step.transfer_reason),
      displayLocation: step.gps_location || step.location || 'Location not specified',
    }));
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateString; }
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

  const getTransferStatusColor = useCallback((eventType) => {
    switch (eventType) {
      case 'CREATED': case 'Initial Creation': return '#10B981';
      case 'LAB_REQUESTED': case 'Lab Testing Request': return '#F59E0B';
      case 'PICKUP': case 'Pickup': return '#3B82F6';
      case 'DELIVERED': case 'Delivery to Lab': return '#8B5CF6';
      case 'LAB_APPROVED': case 'Lab Testing Approved': return '#10B981';
      case 'LAB_REJECTED': case 'Lab Testing Rejected': return '#EF4444';
      case 'MANUFACTURER_ORDER': case 'Manufacturer Order': return '#F97316';
      case 'DELIVERY_COMPLETED': case 'Delivery to Manufacturer': return '#06B6D4';
      default: return '#6B7280';
    }
  }, []);

  return {
    loading, error,
    fetchHerbDetails, fetchTraceabilityData,
    validateBatchId, parseQRData,
    formatJourneyTimeline, showError, showSuccess, clearError,
  };
};
