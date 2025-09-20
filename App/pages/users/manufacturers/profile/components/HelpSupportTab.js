import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import SupportItem from './SupportItem';

const HelpSupportTab = ({ supportLinks }) => {
  const handleSupportLinkPress = (linkId) => {
    Alert.alert('Support Link', `Functionality for ${linkId} will be implemented here.`);
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.title}>Help & Support</Text>
      <FlatList
        data={supportLinks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SupportItem supportLink={item} onPress={handleSupportLinkPress} />}
        contentContainerStyle={styles.supportListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  supportListContent: {
    rowGap: 12, // space-y-3
  },
});

export default HelpSupportTab;