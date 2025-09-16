import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { REPORT_FILTERS, ANALYTICS_SUMMARY, EARNINGS, COMPLIANCE, IMPACT } from './constants';
import { FiltersBar, AnalyticsSummary, EarningsSection, ComplianceSection, ImpactSection } from './components';

const ReportsScreen = () => {
  const [activePeriod, setActivePeriod] = useState(REPORT_FILTERS.activePeriod);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#F9FAFB", "#F3F4F6"]} style={styles.gradient}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={["#059669", "#10B981"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.headerCard}>
            <View>
              {/* Simple decorative header; main header handled by parent */}
            </View>
          </LinearGradient>

          <FiltersBar options={REPORT_FILTERS.periodOptions} active={activePeriod} onChange={setActivePeriod} />

          <AnalyticsSummary data={ANALYTICS_SUMMARY} />
          <EarningsSection data={EARNINGS} />
          <ComplianceSection data={COMPLIANCE} />
          <ImpactSection data={IMPACT} />
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


