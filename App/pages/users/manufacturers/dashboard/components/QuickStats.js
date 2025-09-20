import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import DashboardCard from './DashboardCard';

const screenWidth = Dimensions.get('window').width;

const QuickStats = ({ dashboardCards }) => {
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
        data={dashboardCards}
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