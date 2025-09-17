import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ACTIVITY_DATA } from '../constants';

const ActivityItem = ({ activity, isLast = false }) => {
  return (
    <View style={[styles.activityItem, { marginBottom: isLast ? 0 : 16 }]}>
      <View style={[styles.activityIndicator, { backgroundColor: activity.indicatorColor }]} />
      <View style={styles.activityTextContainer}>
        <Text style={styles.activityText}>{activity.text}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );
};

const RecentActivity = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Recent Activity</Text>
      <View style={[styles.activityCard, styles.cardBorder]}>
        {ACTIVITY_DATA.map((activity, index) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            isLast={index === ACTIVITY_DATA.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#808080',
  },
  cardBorder: {
    borderColor: '#E5E7EB',
  },
});

export default RecentActivity;
