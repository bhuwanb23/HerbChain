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

  /**
   * Get complete traceability history for a herb batch
   * @param {string} batchId - The herb batch ID
   * @returns {Promise<Object>} Complete traceability data with journey timeline
   */
  async fetchTraceabilityData(batchId) {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    try {
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
    } catch (error) {
      console.error('ConsumerAPI.fetchTraceabilityData error:', error);
      throw error;
    }
  }

  /**
   * Format journey timeline for display
   * @param {Array} timeline - Raw timeline data
   * @returns {Array} Formatted timeline data
   */
  formatJourneyTimeline(timeline) {
    if (!timeline || !Array.isArray(timeline)) return [];

    return timeline.map(step => ({
      ...step,
      formattedDate: this.formatDate(step.transfer_date),
      userIcon: this.getUserIcon(step.to_user?.role),
      statusColor: this.getTransferStatusColor(step.transfer_reason),
      displayLocation: step.location || 'Location not specified',
      transportDuration: step.transport_details?.actual_duration 
        ? `${Math.round(step.transport_details.actual_duration / 60)} hours`
        : null
    }));
  }

  /**
   * Get user icon based on role
   * @param {string} role - User role
   * @returns {string} Icon name
   */
  getUserIcon(role) {
    switch (role) {
      case 'farmer': return 'leaf';
      case 'transporter': return 'car';
      case 'lab': return 'flask';
      case 'manufacturer': return 'business';
      default: return 'person';
    }
  }

  /**
   * Get transfer status color
   * @param {string} reason - Transfer reason
   * @returns {string} Color hex code
   */
  getTransferStatusColor(reason) {
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
  }

  /**
   * Get journey summary statistics
   * @param {Object} journeySummary - Journey summary data
   * @returns {Object} Formatted summary statistics
   */
  formatJourneySummary(journeySummary) {
    if (!journeySummary) return null;

    return {
      totalDays: journeySummary.total_days || 0,
      currentLocation: journeySummary.current_location || 'Unknown',
      qualityCertified: journeySummary.quality_certified || false,
      totalDistance: journeySummary.total_distance_km 
        ? `${Math.round(journeySummary.total_distance_km)} km`
        : 'N/A'
    };
  }
}

// Export singleton instance
export default new ConsumerAPI();
