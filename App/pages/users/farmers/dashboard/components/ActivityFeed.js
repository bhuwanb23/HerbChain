import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';

const ActivityFeed = () => {
  const { t } = useGlobalTranslation();
  
  const activities = [
    {
      id: 1,
      icon: '✅',
      iconBg: '#DCFCE7',
      iconColor: '#22c55e',
      title: t.farmerDashboard.activities.basilReady,
      time: `2 ${t.farmerDashboard.timeAgo.hoursAgo}`,
    },
    {
      id: 2,
      icon: '₹',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      title: t.farmerDashboard.activities.paymentReceived,
      time: `5 ${t.farmerDashboard.timeAgo.hoursAgo}`,
    },
    {
      id: 3,
      icon: '⚠️',
      iconBg: '#FED7AA',
      iconColor: '#F97316',
      title: t.farmerDashboard.activities.mintWatering,
      time: `1 ${t.farmerDashboard.timeAgo.dayAgo}`,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.farmerDashboard.recentActivity}</Text>
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
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  activitiesList: {
    gap: 8,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityIconText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default ActivityFeed;
