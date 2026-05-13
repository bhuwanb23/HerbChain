import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import BatchFilter from './components/BatchFilter';

const BatchVerificationScreen = () => {
  const navigation = useNavigation();
  const [activeBatchFilter, setActiveBatchFilter] = useState('All Batches');
  const [activeHerbFilter, setActiveHerbFilter] = useState('Tulsi');
  const [activeLocationFilter, setActiveLocationFilter] = useState('Rajasthan');
  const [activeStatusFilter, setActiveStatusFilter] = useState('Pending');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.mainContent}>
        {/* Progress Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Batch Journey Timeline</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineLine}></View>
            <View style={[styles.timelineProgress, { width: '25%' }]}></View>
            
            <View style={styles.timelineStep}>
              <View style={styles.timelineStepActiveIcon}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.timelineStepText}>Verification</Text>
            </View>
            
            <View style={styles.timelineStep}>
              <View style={styles.timelineStepActiveIcon}>
                <Ionicons name="flask" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.timelineStepText}>Testing</Text>
            </View>
            
            <View style={styles.timelineStep}>
              <View style={styles.timelineStepInactiveIcon}>
                <Ionicons name="shield-outline" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.timelineStepText}>Compliance</Text>
            </View>
            
            <View style={styles.timelineStep}>
              <View style={styles.timelineStepInactiveIcon}>
                <Ionicons name="truck-outline" size={14} color="#9CA3AF" />
              </View>
              <Text style={styles.timelineStepText}>Delivery</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsGrid}>
            <Pressable onPress={() => navigation.navigate('BatchScan')} style={({ pressed }) => [
              styles.quickActionButton,
              styles.primaryBg,
              pressed && styles.buttonPressed
            ]}>
              <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
              <Text style={styles.quickActionButtonText}>QR Scan</Text>
            </Pressable>
            <Pressable onPress={() => console.log('Batch ID Pressed')} style={({ pressed }) => [
              styles.quickActionButton,
              styles.whiteBg,
              styles.cardBorder,
              pressed && styles.buttonPressed
            ]}>
              <Ionicons name="hash-outline" size={28} color="#808080" />
              <Text style={styles.quickActionButtonTextGray}>Batch ID</Text>
            </Pressable>
          </View>
        </View>

        {/* Batch Filters */}
        <BatchFilter 
          activeBatchFilter={activeBatchFilter}
          setActiveBatchFilter={setActiveBatchFilter}
          activeHerbFilter={activeHerbFilter}
          setActiveHerbFilter={setActiveHerbFilter}
          activeLocationFilter={activeLocationFilter}
          setActiveLocationFilter={setActiveLocationFilter}
          activeStatusFilter={activeStatusFilter}
          setActiveStatusFilter={setActiveStatusFilter}
        />

        {/* Batches List */}
        <View style={styles.batchesListSection}>
          <View style={styles.batchesListHeader}>
            <Text style={styles.batchesListTitle}>Active Batches</Text>
            <Text style={styles.batchesListCount}>24 total</Text>
          </View>
          
          {/* Batch Card 1 */}
          <View style={[styles.batchCard, styles.cardBorder]}>
            <View style={styles.batchCardHeader}>
              <Image 
                source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/0efedca586-20b0a7039c4d6d05118c.png' }}
                style={styles.batchImage}
              />
              <View>
                <Text style={styles.batchName}>TUL-2024-001</Text>
                <Text style={styles.batchType}>Tulsi - Premium Grade</Text>
              </View>
            </View>
            <View style={[styles.batchStatus, styles.orange100Bg]}>
              <Text style={styles.batchStatusTextOrange}>Testing</Text>
            </View>
            
            <View style={styles.batchDetails}>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Farmer:</Text>
                <Text style={styles.batchDetailValue}>Rajesh Kumar</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Region:</Text>
                <Text style={styles.batchDetailValue}>Rajasthan</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Received:</Text>
                <Text style={styles.batchDetailValue}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.batchActions}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryBg,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => console.log('Continue Testing TUL-2024-001')}
              >
                <Text style={styles.actionButtonText}>Continue Testing</Text>
              </Pressable>
              <Pressable onPress={() => console.log('View Details TUL-2024-001')} style={({ pressed }) => [
                styles.iconButton,
                styles.cardBorder,
                pressed && styles.buttonPressed
              ]}>
                <Ionicons name="eye-outline" size={20} color="#808080" />
              </Pressable>
            </View>
          </View>

          {/* Batch Card 2 */}
          <View style={[styles.batchCard, styles.cardBorder]}>
            <View style={styles.batchCardHeader}>
              <Image 
                source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4f570a1f87-0aceb3d8cabd2312a2ec.png' }}
                style={styles.batchImage}
              />
              <View>
                <Text style={styles.batchName}>ASH-2024-007</Text>
                <Text style={styles.batchType}>Ashwagandha Root</Text>
              </View>
            </View>
            <View style={[styles.batchStatus, styles.green100Bg]}>
              <Text style={styles.batchStatusTextGreen}>Approved</Text>
            </View>
            
            <View style={styles.batchDetails}>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Farmer:</Text>
                <Text style={styles.batchDetailValue}>Priya Sharma</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Region:</Text>
                <Text style={styles.batchDetailValue}>Maharashtra</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Completed:</Text>
                <Text style={styles.batchDetailValue}>1 day ago</Text>
              </View>
            </View>
            
            <View style={styles.batchActions}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.green600Bg,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => console.log('Mark Delivered ASH-2024-007')}
              >
                <Text style={styles.actionButtonText}>Mark Delivered</Text>
              </Pressable>
              <Pressable onPress={() => console.log('Download Report ASH-2024-007')} style={({ pressed }) => [
                styles.iconButton,
                styles.cardBorder,
                pressed && styles.buttonPressed
              ]}>
                <Ionicons name="download-outline" size={20} color="#808080" />
              </Pressable>
            </View>
          </View>
          
          {/* Batch Card 3 */}
          <View style={[styles.batchCard, styles.cardBorder]}>
            <View style={styles.batchCardHeader}>
              <Image 
                source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c9abf213e7-ee4207663438c9c52cf1.png' }}
                style={styles.batchImage}
              />
              <View>
                <Text style={styles.batchName}>NEE-2024-012</Text>
                <Text style={styles.batchType}>Neem Leaves</Text>
              </View>
            </View>
            <View style={[styles.batchStatus, styles.blue100Bg]}>
              <Text style={styles.batchStatusTextBlue}>Pending</Text>
            </View>
            
            <View style={styles.batchDetails}>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Farmer:</Text>
                <Text style={styles.batchDetailValue}>Amit Patel</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Region:</Text>
                <Text style={styles.batchDetailValue}>Gujarat</Text>
              </View>
              <View style={styles.batchDetailItem}>
                <Text style={styles.batchDetailLabel}>Received:</Text>
                <Text style={styles.batchDetailValue}>30 min ago</Text>
              </View>
            </View>
            
            <View style={styles.batchActions}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.primaryBg,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => console.log('Start Verification NEE-2024-012')}
              >
                <Text style={styles.actionButtonText}>Start Verification</Text>
              </Pressable>
              <Pressable onPress={() => console.log('View Info NEE-2024-012')} style={({ pressed }) => [
                styles.iconButton,
                styles.cardBorder,
                pressed && styles.buttonPressed
              ]}>
                <Ionicons name="information-circle-outline" size={20} color="#808080" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={({ pressed }) => [
          styles.navButton,
          pressed && { opacity: 0.5 }
        ]}>
          <Ionicons name="home-outline" size={20} color="#808080" style={styles.mb1} />
          <Text style={styles.navButtonText}>Dashboard</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Batches')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="cube-outline" size={20} color="#808080" style={styles.mb1} />
          <Text style={styles.navButtonText}>Batches</Text>
        </Pressable>
        <Pressable onPress={() => console.log('Already on Testing Screen')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="flask" size={20} color="#00BFFF" style={styles.mb1} />
          <Text style={[styles.navButtonText, styles.skyBlueText]}>Testing</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Reports')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="bar-chart-outline" size={20} color="#808080" style={styles.mb1} />
          <Text style={styles.navButtonText}>Reports</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="person-outline" size={20} color="#808080" style={styles.mb1} />
          <Text style={styles.navButtonText}>Profile</Text>
        </Pressable>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  mainContent: {
    flex: 1,
    // paddingHorizontal: 16, // mx-4 (handled by sections)
    paddingBottom: 24, // pb-6
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, // mx-4
    marginTop: 16, // mt-4
    borderRadius: 12, // rounded-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    padding: 20, // p-5
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 16, // mb-4
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 16, // top-4
    left: 0,
    right: 0,
    height: 2, // h-0.5
    backgroundColor: '#E5E7EB', // gray-200
  },
  timelineProgress: {
    position: 'absolute',
    top: 16, // top-4
    left: 0,
    height: 2, // h-0.5
    backgroundColor: '#00BFFF', // primary
  },
  timelineStep: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  timelineStepActiveIcon: {
    width: 32, // w-8
    height: 32, // h-8
    backgroundColor: '#00BFFF', // primary
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // mb-2
  },
  timelineStepInactiveIcon: {
    width: 32, // w-8
    height: 32, // h-8
    backgroundColor: '#E5E7EB', // gray-200
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // mb-2
  },
  timelineStepText: {
    fontSize: 12,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },
  quickActionsSection: {
    marginHorizontal: 16, // mx-4
    marginTop: 16, // mt-4
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#00BFFF', // primary
    borderRadius: 12, // rounded-xl
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    width: '48%',
  },
  primaryBg: {
    backgroundColor: '#00BFFF', // primary
  },
  whiteBg: {
    backgroundColor: '#FFFFFF',
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
  },
  quickActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  quickActionButtonTextGray: {
    color: '#4B5563', // gray-700
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  filtersSection: {
    marginHorizontal: 16, // mx-4
    marginTop: 16, // mt-4
  },
  filterScrollContainer: {
    paddingBottom: 8, // pb-2
  },
  filterButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 9999, // rounded-full
    marginRight: 8, // space-x-2
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterButtonTextGray: {
    color: '#374151', // gray-700
    fontSize: 14,
  },
  filterIcon: {
    marginLeft: 4,
  },
  batchesListSection: {
    marginHorizontal: 16, // mx-4
    marginTop: 16, // mt-4
    paddingBottom: 24, // pb-6
  },
  batchesListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
  },
  batchesListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  batchesListCount: {
    fontSize: 14,
    color: '#808080', // accent
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6', // gray-100
    padding: 16,
    marginBottom: 12, // mb-3
  },
  batchCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, // mb-3
  },
  batchImage: {
    width: 48, // w-12
    height: 48, // h-12
    borderRadius: 8, // rounded-lg
    objectFit: 'cover',
    marginRight: 12,
  },
  batchName: {
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  batchType: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  batchStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  orange100Bg: {
    backgroundColor: '#FFEDD5', // orange-100
  },
  batchStatusTextOrange: {
    color: '#9A3412', // orange-800
    fontSize: 12,
    fontWeight: '500',
  },
  green100Bg: {
    backgroundColor: '#DCFCE7', // green-100
  },
  batchStatusTextGreen: {
    color: '#166534', // green-800
    fontSize: 12,
    fontWeight: '500',
  },
  blue100Bg: {
    backgroundColor: '#DBEAFE', // blue-100
  },
  batchStatusTextBlue: {
    color: '#1E40AF', // blue-800
    fontSize: 12,
    fontWeight: '500',
  },
  batchDetails: {
    marginBottom: 12,
  },
  batchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 14,
    marginBottom: 8,
  },
  batchDetailLabel: {
    color: '#4B5563', // gray-600
  },
  batchDetailValue: {
    color: '#111827', // gray-900
  },
  batchActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00BFFF', // primary
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  iconButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bottom Navigation
  // bottomNav: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: '#FFFFFF',
  //   borderTopWidth: 1,
  //   borderTopColor: '#E5E7EB', // gray-200
  //   paddingHorizontal: 20, // px-5
  //   paddingVertical: 12, // py-3
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  // },
  // navButton: {
  //   flexDirection: 'column',
  //   alignItems: 'center',
  // },
  // navButtonText: {
  //   fontSize: 12,
  //   color: '#808080', // dark-grey
  // },
  // skyBlueText: { color: '#00BFFF' }, // sky-blue
});

export default BatchVerificationScreen;