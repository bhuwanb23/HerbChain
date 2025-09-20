import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import SummaryCard from './SummaryCard';

const ReportsSummaryCards = ({ summaryCardsData }) => {
  return (
    <FlatList
      data={summaryCardsData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SummaryCard
          title={item.title}
          value={item.value}
          change={item.change}
          changeType={item.changeType}
          icon={item.icon}
          bgColor={item.bgColor}
          iconColor={item.iconColor}
        />
      )}
      numColumns={1} // Only one column to match the HTML layout
      contentContainerStyle={styles.summaryCardsGrid}
      scrollEnabled={false} // Disable scrolling for this internal FlatList
    />
  );
};

const styles = StyleSheet.create({
  summaryCardsGrid: {
    // Adjust padding if needed, but the parent FlatList will handle main padding
  },
});

export default ReportsSummaryCards;