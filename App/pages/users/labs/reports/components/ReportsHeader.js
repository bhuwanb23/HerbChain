import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReportsHeader = ({ title = 'Reports & History', onNotificationPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Icon name="bar-chart" size={24} color="#00BFFF" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <TouchableOpacity 
          onPress={onNotificationPress} 
          style={styles.notificationButton}
          activeOpacity={0.7}
        >
          <Icon name="notifications" size={20} color="#808080" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
});

export default ReportsHeader;
