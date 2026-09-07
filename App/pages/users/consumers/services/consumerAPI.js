/**
 * Consumer API Service — rewritten for the backend contract.
 *
 * Consumer verification is PUBLIC (no auth) via VerifyAPI.
 * Batch detail, ownership, QR require auth via BatchesAPI/TransfersAPI.
 */
import { BatchesAPI, VerifyAPI, TransfersAPI } from '../../../services/apiClient';

class ConsumerAPI {
  /**
   * Fetch herb details by batch ID (requires auth).
   */
  async fetchHerbDetails(batchId, token) {
    if (!batchId) throw new Error('Batch ID is required');
    const data = await BatchesAPI.get(token, batchId);
    if (!data) throw new Error('Batch not found. Please check the QR code and try again.');
    return {
      herb: data.batch || data,
      ownershipHistory: data.ownership_history || [],
      currentOwner: data.current_holder || null,
    };
  }

  validateBatchId(batchId) {
    if (!batchId || typeof batchId !== 'string') return false;
    return /^[A-Z0-9-_]+$/i.test(batchId.trim());
  }

  parseQRData(qrData) {
    if (typeof qrData === 'string') {
      if (qrData.startsWith('{') && qrData.endsWith('}')) {
        try {
          const parsed = JSON.parse(qrData);
          return parsed.token || parsed.batch_id || qrData;
        } catch (_) { /* fall through */ }
      }
    }
    return qrData.toString().trim();
  }

  /**
   * Get ownership history (requires auth).
   */
  async getOwnershipHistory(batchId, token) {
    const data = await TransfersAPI.ownershipHistory(token, batchId);
    return Array.isArray(data) ? data : data?.history || [];
  }

  /**
   * Get current QR code for a batch (requires auth).
   */
  async getCurrentQR(batchId, token) {
    return BatchesAPI.getQr(token, batchId);
  }

  /**
   * Check if herb batch exists (requires auth).
   */
  async checkBatchExists(batchId, token) {
    try {
      await BatchesAPI.get(token, batchId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format herb data for display.
   */
  formatHerbData(herbData) {
    if (!herbData) return null;
    return {
      ...herbData,
      formattedHarvestDate: this.formatDate(herbData.harvest_date),
      formattedCreatedDate: this.formatDate(herbData.created_at),
      formattedUpdatedDate: this.formatDate(herbData.updated_at),
      displayWeight: herbData.weight_kg ? `${herbData.weight_kg} kg` : 'N/A',
      statusColor: this.getStatusColor(herbData.quality_status),
      statusIcon: this.getStatusIcon(herbData.quality_status),
    };
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return dateString; }
  }

  getStatusColor(status) {
    switch (status) {
      case 'approved': return '#10B981';
      case 'testing': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'testing': return 'time';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  }

  /**
   * Get traceability data via batch history (requires auth).
   */
  async fetchTraceabilityData(batchId, token) {
    if (!batchId) throw new Error('Batch ID is required');
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
  }

  formatJourneyTimeline(timeline) {
    if (!timeline || !Array.isArray(timeline)) return [];
    return timeline.map(step => ({
      ...step,
      formattedDate: this.formatDate(step.created_at || step.transfer_date),
      userIcon: this.getUserIcon(step.actor_role || step.to_user?.role),
      statusColor: this.getTransferStatusColor(step.event_type || step.transfer_reason),
      displayLocation: step.gps_location || step.location || 'Location not specified',
    }));
  }

  getUserIcon(role) {
    switch (role) {
      case 'farmer': return 'leaf';
      case 'transporter': return 'car';
      case 'lab': return 'flask';
      case 'manufacturer': return 'business';
      default: return 'person';
    }
  }

  getTransferStatusColor(eventType) {
    switch (eventType) {
      case 'CREATED': return '#10B981';
      case 'LAB_REQUESTED': return '#F59E0B';
      case 'PICKUP': return '#3B82F6';
      case 'DELIVERED': return '#8B5CF6';
      case 'LAB_APPROVED': return '#10B981';
      case 'LAB_REJECTED': return '#EF4444';
      case 'MANUFACTURER_ORDER': return '#F97316';
      case 'DELIVERY_COMPLETED': return '#06B6D4';
      default: return '#6B7280';
    }
  }

  formatJourneySummary(journeySummary) {
    if (!journeySummary) return null;
    return {
      totalDays: journeySummary.total_days || 0,
      currentLocation: journeySummary.current_location || 'Unknown',
      qualityCertified: journeySummary.quality_certified || false,
      totalDistance: journeySummary.total_distance_km
        ? `${Math.round(journeySummary.total_distance_km)} km` : 'N/A',
    };
  }
}

export default new ConsumerAPI();
