import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProductionTrendsChart = ({ monthlyProductionData }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Production Trends</Text>
        <Icon name="timeline" size={20} color="#2563eb" />
      </View>
      <View style={styles.chartPlaceholder}>
        <Text style={styles.placeholderText}>
          [Placeholder for Production Trends Chart]
        </Text>
        <Text style={styles.subPlaceholderText}>
          Integration with a React Native charting library (e.g., react-native-chart-kit)
          would be needed here to render the actual chart.
        </Text>
        {/* Example of passing data to a hypothetical chart component */}
        {/* <LineChart
          data={monthlyProductionData}
          width={screenWidth - 40} // from react-native-chart-kit example
          height={200}
          chartConfig={chartConfig}
          bezier
        /> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chartPlaceholder: {
    height: 192, // h-48 equivalent
    backgroundColor: '#f3f4f6', // gray-100
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  subPlaceholderText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default ProductionTrendsChart;