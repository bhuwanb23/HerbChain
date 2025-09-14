import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const ChartsSection = ({ weeklyData, successRate }) => {
  const renderWeeklyChart = () => {
    const maxValue = Math.max(...weeklyData);
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {weeklyData.map((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.bar, { height: barHeight }]}>
                  <LinearGradient
                    colors={['#059669', '#10b981']}
                    style={styles.barGradient}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSuccessGauge = () => {
    const circumference = 2 * Math.PI * 50;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (successRate / 100) * circumference;
    
    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gauge}>
          <View style={styles.gaugeBackground}>
            <View style={styles.gaugeTrack} />
          </View>
          <View style={styles.gaugeProgress}>
            <LinearGradient
              colors={['#ef4444', '#f59e0b', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gaugeFill}
            />
          </View>
          <View style={styles.gaugeCenter}>
            <Text style={styles.gaugeValue}>{successRate}%</Text>
            <Text style={styles.gaugeLabel}>Success Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Weekly Performance Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Performance</Text>
        {renderWeeklyChart()}
      </View>

      {/* Success Rate Gauge */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Success Rate</Text>
        {renderSuccessGauge()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    height: 140,
    justifyContent: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  barGradient: {
    flex: 1,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  gaugeContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gauge: {
    width: 120,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  gaugeTrack: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#E5E7EB',
  },
  gaugeProgress: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#10B981',
    transform: [{ rotate: '-90deg' }],
  },
  gaugeFill: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  gaugeLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ChartsSection;
