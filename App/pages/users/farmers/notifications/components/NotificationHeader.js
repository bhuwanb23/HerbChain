import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const NotificationHeader = ({ onBack, onMarkAllRead, onOpenSettings }) => {
  const handleBack = () => {
    Alert.alert('Back', 'Navigate back to previous screen');
    onBack();
  };

  const handleMarkAllRead = () => {
    Alert.alert('Mark All Read', 'All notifications marked as read');
    onMarkAllRead();
  };

  const handleOpenSettings = () => {
    Alert.alert('Settings', 'Open notification settings');
    onOpenSettings();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    marginRight: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default NotificationHeader;
