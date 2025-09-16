import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MonthlyTarget = ({ earned, target, percentage }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Target</Text>
        <Text style={styles.targetAmount}>₹{target?.toLocaleString() || '30,000'}</Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#10B981', '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${percentage || 82}%` }]}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.earnedText}>₹{earned?.toLocaleString() || '24,580'} earned</Text>
        <Text style={styles.percentageText}>{percentage || 82}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  targetAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 6,
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earnedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  percentageText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default MonthlyTarget;
