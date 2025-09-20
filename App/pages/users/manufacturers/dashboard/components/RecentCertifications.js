import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const certificationData = [
  {
    id: '1',
    herbName: 'Turmeric Powder',
    batchId: 'TUR-2024-03',
    status: 'Certified',
    statusColor: '#16a34a',
    timeAgo: '2 hours ago',
    icon: 'check-circle',
    iconBgColor: '#dcfce7',
  },
  {
    id: '2',
    herbName: 'Ashwagandha Root',
    batchId: 'ASH-2024-02',
    status: 'Pending',
    statusColor: '#f59e0b',
    timeAgo: '1 day ago',
    icon: 'hourglass-empty',
    iconBgColor: '#fef3c7',
  },
];

const CertificationItem = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <View style={[styles.iconWrapper, { backgroundColor: item.iconBgColor }]}>
        <Icon name={item.icon} size={20} color={item.statusColor} />
      </View>
      <View>
        <Text style={styles.herbName}>{item.herbName}</Text>
        <Text style={styles.batchId}>Batch #{item.batchId}</Text>
      </View>
    </View>
    <View style={styles.cardRight}>
      <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
      <Text style={styles.timeAgo}>{item.timeAgo}</Text>
    </View>
  </View>
);

const RecentCertifications = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Lab Certifications</Text>
      <FlatList
        data={certificationData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CertificationItem item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10, // Add some horizontal padding
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  herbName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  batchId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default RecentCertifications;