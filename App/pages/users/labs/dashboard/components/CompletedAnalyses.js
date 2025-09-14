import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CompletedAnalyses = ({ analyses = [] }) => {
  const defaultAnalyses = [
    {
      id: 'ANALYSIS-001',
      herbType: 'Ashwagandha',
      farmer: 'Rajesh Kumar',
      status: 'approved',
      completedDate: '2024-01-15',
      qualityScore: 95,
    },
    {
      id: 'ANALYSIS-002',
      herbType: 'Tulsi',
      farmer: 'Priya Sharma',
      status: 'approved',
      completedDate: '2024-01-14',
      qualityScore: 88,
    },
    {
      id: 'ANALYSIS-003',
      herbType: 'Neem',
      farmer: 'Amit Singh',
      status: 'rejected',
      completedDate: '2024-01-13',
      qualityScore: 65,
    },
  ];

  const displayAnalyses = analyses.length > 0 ? analyses : defaultAnalyses;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completed Analyses</Text>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayAnalyses.map((analysis) => (
          <View key={analysis.id} style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Text style={styles.analysisId}>{analysis.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(analysis.status) }]}>
                <Text style={styles.statusText}>{analysis.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.herbType}>{analysis.herbType}</Text>
            <View style={styles.analysisDetails}>
              <Text style={styles.detailText}>👨‍🌾 {analysis.farmer}</Text>
              <Text style={styles.detailText}>📅 {analysis.completedDate}</Text>
            </View>
            <View style={styles.qualitySection}>
              <Text style={styles.qualityLabel}>Quality Score:</Text>
              <Text style={[styles.qualityScore, { color: getQualityColor(analysis.qualityScore) }]}>
                {analysis.qualityScore}%
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 300,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  herbType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  analysisDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  qualitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  qualityScore: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CompletedAnalyses;
