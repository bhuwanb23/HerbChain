import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import BatchScanScreen from './batch_scan/BatchScanScreen';

const TripsPage = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState('batch_scan');

  const getPageTitle = (page) => {
    switch (page) {
      case 'batch_scan':
        return 'Batch Scanner';
      case 'active_trips':
        return 'Active Trips';
      case 'history_reports':
        return 'Trip History';
      default:
        return 'Trips';
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'batch_scan':
        return <BatchScanScreen />;
      case 'active_trips':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Active Trips - Coming Soon</Text>
          </View>
        );
      case 'history_reports':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Trip History - Coming Soon</Text>
          </View>
        );
      default:
        return <BatchScanScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      
      <LinearGradient
        colors={['#F9FAFB', '#F3F4F6']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{getPageTitle(currentPage)}</Text>
          
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Page Content */}
        {renderCurrentPage()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TripsPage;
