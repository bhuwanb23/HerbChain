import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const UrgentRequests = ({ requests = [], onRequestPress }) => {
  const defaultRequests = [
    {
      id: 'URGENT-001',
      type: 'Fast-track Testing',
      herbType: 'Turmeric',
      farmer: 'Suresh Patel',
      deadline: '2024-01-16',
      reason: 'Export deadline',
      priority: 'urgent',
    },
    {
      id: 'URGENT-002',
      type: 'Retest Request',
      herbType: 'Ginger',
      farmer: 'Meera Devi',
      deadline: '2024-01-17',
      reason: 'Previous test failed',
      priority: 'urgent',
    },
  ];

  const displayRequests = requests.length > 0 ? requests : defaultRequests;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Urgent Requests</Text>
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>URGENT</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {displayRequests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
            onPress={() => onRequestPress && onRequestPress(request.id)}
            activeOpacity={0.7}
          >
            <View style={styles.requestHeader}>
              <Text style={styles.requestId}>{request.id}</Text>
              <View style={styles.urgentIndicator}>
                <Text style={styles.urgentIcon}>🚨</Text>
              </View>
            </View>
            <Text style={styles.requestType}>{request.type}</Text>
            <Text style={styles.herbType}>{request.herbType}</Text>
            <View style={styles.requestDetails}>
              <Text style={styles.detailText}>👨‍🌾 {request.farmer}</Text>
              <Text style={styles.detailText}>⏰ {request.deadline}</Text>
            </View>
            <Text style={styles.reason}>Reason: {request.reason}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  urgentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContainer: {
    maxHeight: 250,
  },
  requestCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  urgentIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentIcon: {
    fontSize: 12,
  },
  requestType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 4,
  },
  herbType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  reason: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default UrgentRequests;
