import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const ReportsAnalytics = ({ onGenerateReport }) => {
  const analyticsData = {
    totalBatches: 156,
    approvedBatches: 142,
    rejectedBatches: 14,
    averageQualityScore: 89.5,
    contaminantTrends: [
      { month: 'Jan', pesticide: 2.1, heavyMetals: 0.8, microbial: 1.2 },
      { month: 'Feb', pesticide: 1.8, heavyMetals: 0.6, microbial: 0.9 },
      { month: 'Mar', pesticide: 1.5, heavyMetals: 0.5, microbial: 0.7 },
    ],
    regionQuality: [
      { region: 'Madhya Pradesh', quality: 92, batches: 45 },
      { region: 'Uttar Pradesh', quality: 88, batches: 38 },
      { region: 'Rajasthan', quality: 85, batches: 32 },
      { region: 'Gujarat', quality: 90, batches: 41 },
    ],
    herbPurity: [
      { herb: 'Ashwagandha', purity: 94, batches: 52 },
      { herb: 'Tulsi', purity: 91, batches: 38 },
      { herb: 'Neem', purity: 87, batches: 28 },
      { herb: 'Turmeric', purity: 89, batches: 38 },
    ],
  };

  const handleGenerateReport = (reportType) => {
    onGenerateReport && onGenerateReport(reportType);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports & Analytics</Text>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{analyticsData.totalBatches}</Text>
              <Text style={styles.summaryLabel}>Total Batches</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
                {analyticsData.approvedBatches}
              </Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>
                {analyticsData.rejectedBatches}
              </Text>
              <Text style={styles.summaryLabel}>Rejected</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#8B5CF6' }]}>
                {analyticsData.averageQualityScore}%
              </Text>
              <Text style={styles.summaryLabel}>Avg Quality</Text>
            </View>
          </View>
        </View>

        {/* Contaminant Trends */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Contaminant Trends</Text>
          <View style={styles.chartContainer}>
            {analyticsData.contaminantTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <Text style={styles.trendMonth}>{trend.month}</Text>
                <View style={styles.trendBars}>
                  <View style={[styles.trendBar, { height: trend.pesticide * 10, backgroundColor: '#EF4444' }]} />
                  <View style={[styles.trendBar, { height: trend.heavyMetals * 10, backgroundColor: '#F59E0B' }]} />
                  <View style={[styles.trendBar, { height: trend.microbial * 10, backgroundColor: '#3B82F6' }]} />
                </View>
                <View style={styles.trendLabels}>
                  <Text style={styles.trendLabel}>P: {trend.pesticide}</Text>
                  <Text style={styles.trendLabel}>H: {trend.heavyMetals}</Text>
                  <Text style={styles.trendLabel}>M: {trend.microbial}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Region Quality */}
        <View style={styles.regionSection}>
          <Text style={styles.sectionTitle}>Region-wise Quality</Text>
          {analyticsData.regionQuality.map((region, index) => (
            <View key={index} style={styles.regionItem}>
              <View style={styles.regionInfo}>
                <Text style={styles.regionName}>{region.region}</Text>
                <Text style={styles.regionBatches}>{region.batches} batches</Text>
              </View>
              <View style={styles.regionQuality}>
                <View style={styles.qualityBar}>
                  <View 
                    style={[
                      styles.qualityFill, 
                      { 
                        width: `${region.quality}%`,
                        backgroundColor: region.quality >= 90 ? '#10B981' : region.quality >= 80 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.qualityScore}>{region.quality}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Herb Purity */}
        <View style={styles.herbSection}>
          <Text style={styles.sectionTitle}>Herb Purity Analysis</Text>
          {analyticsData.herbPurity.map((herb, index) => (
            <View key={index} style={styles.herbItem}>
              <View style={styles.herbInfo}>
                <Text style={styles.herbName}>{herb.herb}</Text>
                <Text style={styles.herbBatches}>{herb.batches} batches</Text>
              </View>
              <View style={styles.herbPurity}>
                <View style={styles.purityBar}>
                  <View 
                    style={[
                      styles.purityFill, 
                      { 
                        width: `${herb.purity}%`,
                        backgroundColor: herb.purity >= 90 ? '#10B981' : herb.purity >= 80 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.purityScore}>{herb.purity}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Report Generation */}
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Generate Reports</Text>
          <View style={styles.reportButtons}>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleGenerateReport('ayush')}
            >
              <Text style={styles.reportButtonIcon}>📋</Text>
              <Text style={styles.reportButtonText}>AYUSH Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleGenerateReport('producer')}
            >
              <Text style={styles.reportButtonIcon}>👨‍🌾</Text>
              <Text style={styles.reportButtonText}>Producer Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => handleGenerateReport('comprehensive')}
            >
              <Text style={styles.reportButtonIcon}>📊</Text>
              <Text style={styles.reportButtonText}>Comprehensive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  scrollContainer: {
    maxHeight: 600,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendMonth: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 8,
  },
  trendBar: {
    width: 8,
    borderRadius: 2,
  },
  trendLabels: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  regionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  regionBatches: {
    fontSize: 12,
    color: '#6B7280',
  },
  regionQuality: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualityScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
  },
  herbSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  herbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  herbInfo: {
    flex: 1,
  },
  herbName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  herbBatches: {
    fontSize: 12,
    color: '#6B7280',
  },
  herbPurity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  purityFill: {
    height: '100%',
    borderRadius: 4,
  },
  purityScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
  },
  reportSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  reportButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ReportsAnalytics;
