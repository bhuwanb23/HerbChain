import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CHART_TITLES = {
  contaminantTrends: 'Contaminant Trends (Last 6 Months)',
  herbPurityBreakdown: 'Herb Purity Breakdown',
  qualityHeatmap: 'Quality Heatmap',
};

const ChartComponent = ({ chartType = 'contaminantTrends', onDownload }) => {

  const renderChartPlaceholder = () => {
    return (
      <View style={styles.chartPlaceholder}>
        <Icon name="bar-chart" size={48} color="#9CA3AF" />
        <Text style={styles.chartPlaceholderText}>Chart will be displayed here</Text>
        <Text style={styles.chartPlaceholderSubtext}>
          {chartType === 'contaminantTrends' ? 'Line chart showing contaminant trends over time' :
           chartType === 'herbPurityBreakdown' ? 'Pie chart showing herb purity distribution' :
           'Interactive heatmap showing regional quality data'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{CHART_TITLES[chartType] || 'Quality Heatmap'}</Text>
          <TouchableOpacity 
            onPress={() => onDownload && onDownload(chartType)}
            style={styles.downloadButton}
            activeOpacity={0.7}
          >
            <Icon name="download" size={20} color="#00BFFF" />
          </TouchableOpacity>
        </View>
        {renderChartPlaceholder()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  chartPlaceholder: {
    height: 256,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});

export default ChartComponent;
