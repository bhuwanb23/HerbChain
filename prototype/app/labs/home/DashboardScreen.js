import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo for icons
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const toggleNotificationsModal = () => {
    setNotificationsModalVisible(!isNotificationsModalVisible);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lab Test Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, Dr. Smith</Text>
        </View>
        <TouchableOpacity onPress={toggleNotificationsModal} style={styles.notificationIconContainer}>
          <Ionicons name="notifications" size={24} color="#808080" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent}>
        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.card, styles.cardBorder]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={24} color="#00BFFF" />
              <Text style={styles.cardValue}>12</Text>
            </View>
            <Text style={styles.cardTitle}>Pending Batches</Text>
            <Text style={styles.cardSubtitle}>Need testing</Text>
          </View>

          <View style={[styles.card, styles.red50Bg, styles.red200Border]}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
              <Text style={styles.cardValueRed}>3</Text>
            </View>
            <Text style={styles.cardTitleRed}>Urgent Requests</Text>
            <Text style={styles.cardSubtitleRed}>Fast-track testing</Text>
          </View>

          <View style={[styles.card, styles.green50Bg, styles.green200Border]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" />
              <Text style={styles.cardValueGreen}>48</Text>
            </View>
            <Text style={styles.cardTitleGreen}>Completed</Text>
            <Text style={styles.cardSubtitleGreen}>This week</Text>
          </View>

          <View style={[styles.card, styles.yellow50Bg, styles.yellow200Border]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-half-outline" size={24} color="#EAB308" />
              <Text style={styles.cardValueYellow}>2</Text>
            </View>
            <Text style={styles.cardTitleYellow}>Failed Compliance</Text>
            <Text style={styles.cardSubtitleYellow}>Needs retest</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.primaryBg]}
              onPress={() => navigation.navigate('Batches')}
            >
              <Ionicons name="flask-outline" size={24} color="#FFFFFF" />
              <Text style={styles.quickActionButtonText}>Batch Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.whiteBg, styles.cardBorder]}
              onPress={() => navigation.navigate('Testing')}
            >
              <Ionicons name="clipboard-outline" size={24} color="#374151" />
              <Text style={styles.quickActionButtonTextGray}>Testing & Results</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Panel */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>Recent Notifications</Text>
            <TouchableOpacity onPress={toggleNotificationsModal} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.notificationList}>
            <View style={[styles.notificationCard, styles.cardBorder]}>
              <View style={styles.notificationContent}>
                <Ionicons name="alert-circle-outline" size={24} color="#EF4444" style={styles.notificationIcon} />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>Batch #B2024-0156 failed compliance</Text>
                  <Text style={styles.notificationSubtitle}>Contaminant levels exceeded threshold</Text>
                  <View style={styles.notificationActions}>
                    <Text style={styles.notificationTime}>2 hours ago</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ComplianceApproval')}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.notificationCard, styles.cardBorder]}>
              <View style={styles.notificationContent}>
                <Ionicons name="information-circle-outline" size={24} color="#00BFFF" style={styles.notificationIcon} />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>Urgent request: Batch #B2024-0158</Text>
                  <Text style={styles.notificationSubtitle}>Priority testing required by EOD</Text>
                  <View style={styles.notificationActions}>
                    <Text style={styles.notificationTime}>4 hours ago</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TestingResultsEntry')}>
                      <Text style={styles.viewDetailsText}>Start Testing</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={[styles.notificationCard, styles.cardBorder]}>
              <View style={styles.notificationContent}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" style={styles.notificationIcon} />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>Batch #B2024-0154 completed</Text>
                  <Text style={styles.notificationSubtitle}>All tests passed, report generated</Text>
                  <View style={styles.notificationActions}>
                    <Text style={styles.notificationTime}>6 hours ago</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ReportsAnalytics')}>
                      <Text style={styles.viewDetailsText}>View Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          <View style={[styles.activityCard, styles.cardBorder]}>
            <View style={[styles.activityItem, { marginBottom: 16 }]}>
              <View style={[styles.activityIndicator, styles.greenBg]}></View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityText}>Batch #B2024-0153 analysis completed</Text>
                <Text style={styles.activityTime}>30 minutes ago</Text>
              </View>
            </View>
            <View style={[styles.activityItem, { marginBottom: 16 }]}>
              <View style={[styles.activityIndicator, styles.primaryBg]}></View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityText}>Started testing Batch #B2024-0157</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
            <View style={[styles.activityItem, { marginBottom: 0 }]}>
              <View style={[styles.activityIndicator, styles.yellowBg]}></View>
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityText}>Retest scheduled for Batch #B2024-0155</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isNotificationsModalVisible}
        onRequestClose={toggleNotificationsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={toggleNotificationsModal}>
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>
            <ScrollView>
              {/* Reusing the notification cards from the main dashboard for consistency */}
              <View style={styles.notificationList}>
                <View style={[styles.notificationCard, styles.cardBorder]}>
                  <View style={styles.notificationContent}>
                    <Ionicons name="alert-circle-outline" size={24} color="#EF4444" style={styles.notificationIcon} />
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>Batch #B2024-0156 failed compliance</Text>
                      <Text style={styles.notificationSubtitle}>Contaminant levels exceeded threshold</Text>
                      <View style={styles.notificationActions}>
                        <Text style={styles.notificationTime}>2 hours ago</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ComplianceApproval')}>
                          <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={[styles.notificationCard, styles.cardBorder]}>
                  <View style={styles.notificationContent}>
                    <Ionicons name="information-circle-outline" size={24} color="#00BFFF" style={styles.notificationIcon} />
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>Urgent request: Batch #B2024-0158</Text>
                      <Text style={styles.notificationSubtitle}>Priority testing required by EOD</Text>
                      <View style={styles.notificationActions}>
                        <Text style={styles.notificationTime}>4 hours ago</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TestingResultsEntry')}>
                          <Text style={styles.viewDetailsText}>Start Testing</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.notificationCard, styles.cardBorder]}>
                  <View style={styles.notificationContent}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" style={styles.notificationIcon} />
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>Batch #B2024-0154 completed</Text>
                      <Text style={styles.notificationSubtitle}>All tests passed, report generated</Text>
                      <View style={styles.notificationActions}>
                        <Text style={styles.notificationTime}>6 hours ago</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ReportsAnalytics')}>
                          <Text style={styles.viewDetailsText}>View Report</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // lightgray
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006B38', // theme-primary-700
  },
  headerSubtitle: {
    fontSize: 14, // Slightly larger for better readability
    color: '#6B7280', // theme-neutral-500
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444', // red-500
    borderRadius: 9999, // rounded-full
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 96, // pb-24
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24, // mb-6
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    width: '48%', // approximate grid-cols-2 spacing
    marginBottom: 16, // gap-4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // shadow-sm
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // mb-2
  },
  cardValue: {
    fontSize: 28, // Larger value for prominence
    fontWeight: 'bold',
    color: '#004422', // theme-primary-900 for stronger contrast
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500', // font-medium
    color: '#374151', // gray-700
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#808080', // accent
  },
  cardBorder: {
    borderColor: '#E5E7EB', // gray-200
  },
  red50Bg: {
    backgroundColor: '#FEF2F2', // red-50
  },
  red200Border: {
    borderColor: '#FECACA', // red-200
  },
  cardValueRed: {
    fontSize: 28, // Larger value for prominence
    fontWeight: 'bold',
    color: '#7F1D1D', // theme-red-800 for stronger contrast
  },
  cardTitleRed: {
    fontSize: 14,
    fontWeight: '500', // font-medium
    color: '#B91C1C', // red-700
  },
  cardSubtitleRed: {
    fontSize: 12,
    color: '#EF4444', // red-500
  },
  green50Bg: {
    backgroundColor: '#F0FDF4', // green-50
  },
  green200Border: {
    borderColor: '#BBF7D0', // green-200
  },
  cardValueGreen: {
    fontSize: 28, // Larger value for prominence
    fontWeight: 'bold',
    color: '#14532D', // theme-green-800 for stronger contrast
  },
  cardTitleGreen: {
    fontSize: 14,
    fontWeight: '500', // font-medium
    color: '#15803D', // green-700
  },
  cardSubtitleGreen: {
    fontSize: 12,
    color: '#22C55E', // green-500
  },
  yellow50Bg: {
    backgroundColor: '#FEFCE8', // yellow-50
  },
  yellow200Border: {
    borderColor: '#FEF08A', // yellow-200
  },
  cardValueYellow: {
    fontSize: 28, // Larger value for prominence
    fontWeight: 'bold',
    color: '#78350F', // theme-yellow-800 for stronger contrast
  },
  cardTitleYellow: {
    fontSize: 14,
    fontWeight: '500', // font-medium
    color: '#A16207', // yellow-700
  },
  cardSubtitleYellow: {
    fontSize: 12,
    color: '#EAB308', // yellow-500
  },
  section: {
    marginBottom: 24, // mb-6
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600', // font-semibold
    color: '#111827', // gray-900
  },
  viewAllText: {
    color: '#FFFFFF', // White text for contrast
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#006B38', // A themed green background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5, // Slightly rounded corners
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 8, // rounded-lg
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryBg: {
    backgroundColor: '#00BFFF', // primary
  },
  whiteBg: {
    backgroundColor: '#FFFFFF',
  },
  quickActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  quickActionButtonTextGray: {
    color: '#374151', // gray-700
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  notificationList: {
    // spacing managed by marginBottom on notificationCard
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827', // gray-900
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#808080', // accent
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#808080', // accent
  },
  viewDetailsText: {
    color: '#00BFFF', // primary
    fontSize: 12,
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111827', // gray-900
  },
  activityTime: {
    fontSize: 12,
    color: '#808080', // accent
  },
  greenBg: {
    backgroundColor: '#22C55E', // green-500
  },
  yellowBg: {
    backgroundColor: '#EAB308', // yellow-500
  },
  filterScrollView: {
    paddingHorizontal: 10, // Adjust as needed for horizontal scroll
    paddingBottom: 10, // Add some padding at the bottom
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 107, 56, 0.6)', // A darker, themed overlay
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22, // Slightly larger title for impact
    fontWeight: 'bold',
    color: '#004422', // Darker theme green for prominence
  },
});

export default DashboardScreen;