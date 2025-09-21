import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';
import DashboardCard from './DashboardCard';

const screenWidth = Dimensions.get('window').width;

const QuickStats = ({ dashboardCards }) => {
  const { t } = useGlobalTranslation();
  
  // Create translated dashboard cards
  const translatedCards = dashboardCards?.map(card => ({
    ...card,
    title: card.id === 'active_batches'
      ? (t.manufacturerDashboard?.activeBatches || 'Active Batches')
      : card.id === 'pending_deliveries'
      ? (t.manufacturerDashboard?.pendingDeliveries || 'Pending Deliveries')
      : card.id === 'recent_certifications'
      ? (t.manufacturerDashboard?.recentCertifications || 'Recent Certifications')
      : (t.manufacturerDashboard?.productsCreated || 'Products Created')
  })) || [];
  
  const renderCard = ({ item }) => (
    <DashboardCard
      title={item.title}
      value={item.value}
      iconName={item.iconName}
      color={item.color}
      iconBgColor={item.iconBgColor}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={translatedCards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2} // Display 2 cards per row
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        scrollEnabled={false} // Disable scrolling for this internal FlatList
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  flatListContent: {
    justifyContent: 'space-between',
  },
  row: {
    flex: 1,
    justifyContent: 'space-around',
    marginBottom: 10, // Space between rows
  },
});

export default QuickStats;