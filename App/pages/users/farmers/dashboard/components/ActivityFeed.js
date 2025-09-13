import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      icon: '✅',
      iconBg: '#DCFCE7',
      iconColor: '#22c55e',
      title: 'Basil batch #B-2024-03 ready for harvest',
      time: '2 hours ago',
    },
    {
      id: 2,
      icon: '₹',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: 'Payment received: ₹4,200',
      time: '5 hours ago',
    },
    {
      id: 3,
      icon: '⚠️',
      iconBg: '#FED7AA',
      iconColor: '#F97316',
      title: 'Mint batch needs watering',
      time: '1 day ago',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      <View style={styles.activitiesList}>
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: activity.iconBg }]}>
              <Text style={[styles.activityIconText, { color: activity.iconColor }]}>
                {activity.icon}
              </Text>
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for bottom action button
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ActivityFeed;
