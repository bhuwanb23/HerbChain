import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TripDetails = ({ tripData, batchData }) => {
  const detailItems = [
    {
      id: 'batch',
      icon: '📊',
      title: 'Batch IDs',
      value: tripData?.batchIds?.join(', ') || batchData?.batchId || 'N/A',
      color: '#3B82F6',
    },
    {
      id: 'delivery',
      icon: '⏰',
      title: 'Expected Delivery',
      value: tripData?.expectedDelivery || 'Today, 2:30 PM',
      color: '#F59E0B',
    },
    {
      id: 'compliance',
      icon: '🛡️',
      title: 'Compliance',
      value: tripData?.compliance || 'Temperature Controlled',
      color: '#10b981',
      status: 'Active',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Details</Text>
      
      <View style={styles.detailsList}>
        {detailItems.map((item) => (
          <View key={item.id} style={styles.detailItem}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIcon, { backgroundColor: `${item.color}20` }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailTitle}>{item.title}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
            {item.status && (
              <View style={[styles.statusBadge, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.statusText, { color: item.color }]}>
                  {item.status}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailsList: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TripDetails;
