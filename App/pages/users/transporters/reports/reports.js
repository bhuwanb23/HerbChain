import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReportsData } from './hooks';
import { TimeFilter, PerformanceOverview, EarningsBreakdown, ChartsSection, ExportOptions, ReceiptsList } from './components';

const ReportsScreen = () => {
  const { period, setPeriod, filters, analytics, earnings, charts, receipts } = useReportsData();

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#F9FAFB", "#F3F4F6"]} style={styles.gradient}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={["#059669", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerCard}>
            <View />
          </LinearGradient>

          <TimeFilter options={filters} active={period} onChange={setPeriod} />
          <PerformanceOverview analytics={analytics} />
          <EarningsBreakdown earnings={earnings} />
          <ChartsSection charts={charts} />
          <ExportOptions />
          <ReceiptsList items={receipts} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerCard: {
    margin: 16,
    borderRadius: 16,
    height: 56,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ReportsScreen;


