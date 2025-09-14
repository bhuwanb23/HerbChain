import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TripDetails = ({ tripData }) => {
  const detailItems = [
    {
      id: 'batch',
      icon: '📊',
      title: 'Batch IDs',
      value: tripData.batchIds.join(', '),
      color: '#3B82F6',
    },
    {
      id: 'delivery',
      icon: '⏰',
      title: 'Expected Delivery',
      value: tripData.expectedDelivery,
      color: '#F59E0B',
    },
    {
      id: 'compliance',
      icon: '🛡️',
      title: 'Compliance',
      value: tripData.compliance,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TripDetails;
