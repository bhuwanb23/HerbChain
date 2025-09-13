import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const Header = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {navigation && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.syncStatus}>
          <View style={styles.syncIndicator} />
          <Text style={styles.syncText}>Synced</Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backIcon: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    marginRight: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 12,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  notificationButton: {
    padding: 4,
  },
  notificationIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
});

export default Header;
