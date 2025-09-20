import { API_BASE_URL } from '../../../../constants/api';

/**
 * Consumer API Service
 * Handles all API calls related to consumer functionality
 */
class ConsumerAPI {
  /**
   * Fetch herb details by batch ID
   * @param {string} batchId - The herb batch ID
   * @returns {Promise<Object|null>} Herb data or null if error
   */
  async fetchHerbDetails(batchId) {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    try {
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
    } catch (error) {
      console.error('ConsumerAPI.fetchHerbDetails error:', error);
      throw error;
    }
  }

  /**
   * Validate batch ID format
   * @param {string} batchId - The batch ID to validate
   * @returns {boolean} True if valid format
   */
  validateBatchId(batchId) {
    if (!batchId || typeof batchId !== 'string') {
      return false;
    }

    // Basic validation for herb batch ID format
    // Expected format: HERB-XXXXXXXX or similar
    const batchIdPattern = /^[A-Z0-9-_]+$/i;
    return batchIdPattern.test(batchId.trim());
  }

  /**
   * Parse QR code data to extract batch ID
   * @param {string} qrData - Raw QR code data
   * @returns {string} Extracted batch ID
   */
  parseQRData(qrData) {
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
  }

  /**
   * Get herb ownership history
   * @param {string} batchId - The herb batch ID
   * @returns {Promise<Array>} Ownership history array
   */
  async getOwnershipHistory(batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/ownership`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ownership history');
      }

      const data = await response.json();
      return data.ownership_history || [];
    } catch (error) {
      console.error('ConsumerAPI.getOwnershipHistory error:', error);
      throw error;
    }
  }

  /**
   * Get current QR code for a batch
   * @param {string} batchId - The herb batch ID
   * @returns {Promise<Object>} QR code information
   */
  async getCurrentQR(batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch QR code');
      }

      return await response.json();
    } catch (error) {
      console.error('ConsumerAPI.getCurrentQR error:', error);
      throw error;
    }
  }

  /**
   * Check if herb batch exists
   * @param {string} batchId - The herb batch ID
   * @returns {Promise<boolean>} True if batch exists
   */
  async checkBatchExists(batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/herbs/${batchId}`, {
        method: 'HEAD', // Use HEAD to check existence without downloading data
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('ConsumerAPI.checkBatchExists error:', error);
      return false;
    }
  }

  /**
   * Format herb data for display
   * @param {Object} herbData - Raw herb data from API
   * @returns {Object} Formatted herb data
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

  /**
   * Format date string for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get status color for quality status
   * @param {string} status - Quality status
   * @returns {string} Color hex code
   */
  getStatusColor(status) {
    switch (status) {
      case 'approved': return '#10B981';
      case 'testing': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  }

  /**
   * Get status icon for quality status
   * @param {string} status - Quality status
   * @returns {string} Icon name
   */
  getStatusIcon(status) {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'testing': return 'time';
      case 'rejected': return 'close-circle';
      case 'pending': return 'hourglass';
      default: return 'help-circle';
    }
  }
}

// Export singleton instance
export default new ConsumerAPI();
