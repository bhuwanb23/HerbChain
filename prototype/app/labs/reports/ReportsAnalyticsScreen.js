import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ReportsAnalyticsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('history'); // 'reports' or 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedDateRange, setSelectedDateRange] = useState('Date Range');

  const handleGenerateChart = (type) => {
    console.log(`Generate ${type} Chart`);
    // Logic to generate chart based on type
  };

  const handleGenerateReport = (type) => {
    console.log(`Generate ${type} Report`);
    // Logic to generate report based on type
  };

  const handleViewHeatmap = () => {
    console.log('View Heatmap');
    // Logic to view heatmap
  };

  const handleSearchArchive = () => {
    console.log(`Searching archive for query: ${searchQuery}, region: ${selectedRegion}, date range: ${selectedDateRange}`);
    // Logic to search archive
  };

  const handleViewReport = (batchId) => {
    console.log(`View Report for ${batchId}`);
    // Logic to view a specific report
  };

  const handleDownloadReport = (batchId) => {
    console.log(`Download Report for ${batchId}`);
    // Logic to download a specific report
  };

  const handleShareReport = (batchId) => {
    console.log(`Share Report for ${batchId}`);
    // Logic to share a specific report
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF');
  };

  const handleExportExcel = () => {
    console.log('Exporting Excel');
  };

  const handleShareWithAYUSH = () => {
    console.log('Sharing with AYUSH');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="stats-chart-outline" size={24} color="#00BFFF" />
            <Text style={styles.headerTitle}>Reports & History</Text>
          </View>
          <Pressable onPress={() => console.log('Notification Bell Pressed')} style={({ pressed }) => [styles.notificationButton, pressed && styles.buttonPressed]}>
            <Ionicons name="notifications-outline" size={20} color="#808080" />
          </Pressable>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <Pressable
          onPress={() => setActiveTab('reports')}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'reports' && styles.activeTabButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'reports' ? styles.activeTabButtonText : styles.inactiveTabButtonText]}>Reports</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'history' && styles.activeTabButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' ? styles.activeTabButtonText : styles.inactiveTabButtonText]}>History</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.mainContent}>
        {activeTab === 'reports' && (
          <>
            {/* Generate Reports Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generate Reports</Text>
              <View style={styles.gridContainer}>
                {/* Contaminant Trends */}
                <Pressable onPress={() => handleGenerateChart('Contaminant Trends')} style={({ pressed }) => [styles.reportCard, pressed && styles.buttonPressed]}>
                  <View style={styles.reportCardHeader}>
                    <Text style={styles.reportCardTitle}>Contaminant Trends</Text>
                    <Ionicons name="stats-chart-outline" size={20} color="#00BFFF" />
                  </View>
                  <Text style={styles.reportCardDescription}>6-month contamination analysis</Text>
                  <Pressable onPress={() => handleGenerateChart('Contaminant Trends')} style={({ pressed }) => [styles.generateButton, pressed && styles.buttonPressed]}>
                    <Text style={styles.generateButtonText}>Generate Chart</Text>
                  </Pressable>
                </Pressable>

                {/* Herb Purity Breakdown */}
                <Pressable onPress={() => handleGenerateReport('Herb Purity Breakdown')} style={({ pressed }) => [styles.reportCard, pressed && styles.buttonPressed]}>
                  <View style={styles.reportCardHeader}>
                    <Text style={styles.reportCardTitle}>Herb Purity Breakdown</Text>
                    <Ionicons name="pie-chart-outline" size={20} color="#00BFFF" />
                  </View>
                  <Text style={styles.reportCardDescription}>Purity percentage by batch</Text>
                  <Pressable onPress={() => handleGenerateReport('Herb Purity Breakdown')} style={({ pressed }) => [styles.generateButton, pressed && styles.buttonPressed]}>
                    <Text style={styles.generateButtonText}>Generate Report</Text>
                  </Pressable>
                </Pressable>
              </View>

              {/* Quality Heatmap */}
              <Pressable onPress={handleViewHeatmap} style={({ pressed }) => [styles.reportCard, styles.mt4, pressed && styles.buttonPressed]}>
                  <View style={styles.reportCardHeader}>
                      <Text style={styles.reportCardTitle}>Quality Heatmap</Text>
                      <Ionicons name="map-outline" size={20} color="#00BFFF" />
                  </View>
                  <Text style={styles.reportCardDescription}>Region-wise quality analysis</Text>
                  <Pressable onPress={handleViewHeatmap} style={({ pressed }) => [styles.generateButton, pressed && styles.buttonPressed]}>
                      <Text style={styles.generateButtonText}>View Heatmap</Text>
                  </Pressable>
              </Pressable>
            </View>

            {/* Sample Chart */}
            <View style={styles.section}>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Contaminant Trends (Last 6 Months)</Text>
                  <Pressable onPress={() => console.log('Download Chart')} style={({ pressed }) => [pressed && styles.buttonPressed]}>
                    <Ionicons name="download-outline" size={20} color="#00BFFF" />
                  </Pressable>
                </View>
                {/* Placeholder for Highcharts. Actual integration requires a WebView or a React Native chart library */}
                <View style={styles.chartPlaceholder}>
                  <Text style={styles.chartPlaceholderText}>Chart will be displayed here</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {/* Search & Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Records</Text>
              <View style={styles.searchFilterCard}>
                <View style={styles.mb4}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search-outline" size={16} color="#808080" style={styles.searchInputIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by herb type (e.g., Tulsi)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                <View style={styles.gridContainerSmall}>
                  <View style={styles.selectContainer}>
                    <TextInput // Using TextInput to simulate select dropdown
                      style={styles.selectInput}
                      value={selectedRegion}
                      onChangeText={setSelectedRegion}
                      placeholder="All Regions"
                    />
                    {/* Add actual dropdown functionality if needed, e.g., with react-native-picker-select */}
                  </View>
                  <View style={styles.selectContainer}>
                    <TextInput // Using TextInput to simulate select dropdown
                      style={styles.selectInput}
                      value={selectedDateRange}
                      onChangeText={setSelectedDateRange}
                      placeholder="Date Range"
                    />
                    {/* Add actual dropdown functionality if needed */}
                  </View>
                </View>

                <Pressable onPress={handleSearchArchive} style={({ pressed }) => [styles.searchButton, styles.mt3, pressed && styles.buttonPressed]}>
                  <Text style={styles.searchButtonText}>Search Archive</Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Reports */}
            <View style={styles.section}>
              <View style={styles.recentReportsHeader}>
                <Text style={styles.sectionTitle}>Recent Reports</Text>
                <Pressable onPress={() => console.log('View All Reports')} style={({ pressed }) => [pressed && styles.buttonPressed]}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>

              <View style={styles.spaceY3}>
                {/* Report Card 1 */}
                <View style={styles.reportItemCard}>
                  <View style={styles.reportItemContent}>
                    <View style={styles.flex1}>
                      <Text style={styles.reportItemTitle}>Tulsi Batch #TB-2024-156</Text>
                      <Text style={styles.reportItemSubtitle}>Rajasthan • 2 days ago</Text>
                      <View style={styles.reportItemStatusContainer}>
                        <View style={styles.statusPassed}>
                          <Text style={styles.statusPassedText}>Passed</Text>
                        </View>
                        <Text style={styles.purityText}>98.5% Purity</Text>
                      </View>
                    </View>
                    <View style={styles.reportItemActions}>
                      <Pressable onPress={() => handleViewReport('TB-2024-156')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="eye-outline" size={20} color="#00BFFF" />
                      </Pressable>
                      <Pressable onPress={() => handleDownloadReport('TB-2024-156')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="download-outline" size={20} color="#00BFFF" />
                      </Pressable>
                      <Pressable onPress={() => handleShareReport('TB-2024-156')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="share-social-outline" size={20} color="#00BFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Report Card 2 */}
                <View style={styles.reportItemCard}>
                  <View style={styles.reportItemContent}>
                    <View style={styles.flex1}>
                      <Text style={styles.reportItemTitle}>Ashwagandha Batch #AB-2024-143</Text>
                      <Text style={styles.reportItemSubtitle}>Gujarat • 4 days ago</Text>
                      <View style={styles.reportItemStatusContainer}>
                        <View style={styles.statusRetest}>
                          <Text style={styles.statusRetestText}>Retest</Text>
                        </View>
                        <Text style={styles.purityText}>89.2% Purity</Text>
                      </View>
                    </View>
                    <View style={styles.reportItemActions}>
                      <Pressable onPress={() => handleViewReport('AB-2024-143')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="eye-outline" size={20} color="#00BFFF" />
                      </Pressable>
                      <Pressable onPress={() => handleDownloadReport('AB-2024-143')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="download-outline" size={20} color="#00BFFF" />
                      </Pressable>
                      <Pressable onPress={() => handleShareReport('AB-2024-143')} style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}>
                        <Ionicons name="share-social-outline" size={20} color="#00BFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Export & Share Section */}
            <View style={styles.section}>
              <View style={styles.exportShareCard}>
                <Text style={styles.sectionTitle}>Export & Share</Text>
                <View style={styles.gridContainerSmall}>
                  <Pressable onPress={handleExportPDF} style={({ pressed }) => [styles.exportButton, pressed && styles.buttonPressed]}>
                    <Ionicons name="document-text-outline" size={20} color="#EF4444" />
                    <Text style={styles.exportButtonText}>Export PDF</Text>
                  </Pressable>
                  <Pressable onPress={handleExportExcel} style={({ pressed }) => [styles.exportButton, pressed && styles.buttonPressed]}>
                    <Ionicons name="file-tray-full-outline" size={20} color="#22C55E" />
                    <Text style={styles.exportButtonText}>Export Excel</Text>
                  </Pressable>
                </View>
                <Pressable onPress={handleShareWithAYUSH} style={({ pressed }) => [styles.shareAyushButton, styles.mt3, pressed && styles.buttonPressed]}>
                  <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.shareAyushButtonText}>Share with AYUSH</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="home-outline" size={20} color="#808080" />
          <Text style={styles.navButtonText}>Dashboard</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('BatchVerification')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#808080" />
          <Text style={styles.navButtonText}>Verification</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Testing')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="flask-outline" size={20} color="#808080" />
          <Text style={styles.navButtonText}>Testing</Text>
        </Pressable>
        <Pressable onPress={() => console.log('Already on Reports Screen')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
        ]}>
          <Ionicons name="stats-chart" size={20} color="#00BFFF" />
          <Text style={[styles.navButtonText, styles.primaryText]}>Reports</Text>
        </Pressable>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // bg-gray-50
  },
  buttonPressed: {
    opacity: 0.8,
  },
  header: {
    backgroundColor: '#FFFFFF', // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
    padding: 20, // p-5
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // space-x-3
  },
  headerTitle: {
    fontSize: 20, // text-xl
    fontWeight: 'bold', // font-bold
    color: '#111827', // text-gray-900
  },
  notificationButton: {
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
    backgroundColor: '#F3F4F6', // bg-gray-100
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
    paddingHorizontal: 20, // px-5
  },
  tabButton: {
    paddingVertical: 16, // py-4
    marginRight: 24, // space-x-6 (each button's right margin)
  },
  tabButtonText: {
    fontSize: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#00BFFF', // border-primary
  },
  activeTabButtonText: {
    color: '#00BFFF', // text-primary
    fontWeight: '600', // font-semibold
  },
  inactiveTabButtonText: {
    color: '#808080', // text-accent
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20, // px-5
    paddingBottom: 80, // pb-20 (to account for potential bottom nav if it were present)
  },
  section: {
    marginTop: 20, // mt-5
    marginBottom: 10, // Added for spacing between sections
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: 'bold', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 16, // mb-4
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'row', // grid grid-cols-1 gap-4
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24, // mb-6
  },
  gridContainerSmall: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // gap-3
  },
  reportCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
    flex: 1, // to make it take available width
    minWidth: '48%', // approximate width for 2 columns, adjust as needed
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // mb-3
  },
  reportCardTitle: {
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  reportCardDescription: {
    fontSize: 14, // text-sm
    color: '#808080', // text-accent
    marginBottom: 12, // mb-3
  },
  generateButton: {
    width: '100%', // w-full
    backgroundColor: '#00BFFF', // bg-primary
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF', // text-white
    fontWeight: '500', // font-medium
  },
  mt4: {
    marginTop: 16, // mt-4
  },
  chartCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
  },
  chartTitle: {
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  chartPlaceholder: {
    height: 256, // h-64
    backgroundColor: '#F3F4F6', // bg-gray-100 for visual placeholder
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    color: '#808080',
    fontSize: 16,
  },
  searchFilterCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputIcon: {
    position: 'absolute',
    left: 12, // left-3
    top: 12, // top-3
    zIndex: 1,
  },
  searchInput: {
    width: '100%', // w-full
    paddingLeft: 40, // pl-10
    paddingRight: 16, // pr-4
    paddingVertical: 8, // py-2
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    borderRadius: 8, // rounded-lg
    color: '#111827',
  },
  selectContainer: {
    flex: 1, // To take half width in a row
  },
  selectInput: { // Simulating select dropdown with TextInput
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    borderRadius: 8, // rounded-lg
    color: '#111827',
  },
  searchButton: {
    width: '100%', // w-full
    backgroundColor: '#00BFFF', // bg-primary
    paddingVertical: 8, // py-2
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF', // text-white
    fontWeight: '500', // font-medium
  },
  recentReportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // mb-4
  },
  viewAllText: {
    color: '#00BFFF', // text-primary
    fontSize: 14, // text-sm
  },
  spaceY3: {
    gap: 12, // space-y-3
  },
  reportItemCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
  },
  reportItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex1: {
    flex: 1,
  },
  reportItemTitle: {
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  reportItemSubtitle: {
    fontSize: 14, // text-sm
    color: '#808080', // text-accent
  },
  reportItemStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // mt-2
  },
  statusPassed: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    backgroundColor: '#DCFCE7', // bg-green-100
    borderRadius: 9999, // rounded-full
  },
  statusPassedText: {
    color: '#166534', // text-green-800
    fontSize: 12, // text-xs
  },
  statusRetest: {
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    backgroundColor: '#FEF9C3', // bg-yellow-100
    borderRadius: 9999, // rounded-full
  },
  statusRetestText: {
    color: '#854D0E', // text-yellow-800
    fontSize: 12, // text-xs
  },
  purityText: {
    marginLeft: 8, // ml-2
    fontSize: 14, // text-sm
    color: '#808080', // text-accent
  },
  reportItemActions: {
    flexDirection: 'row',
    gap: 8, // space-x-2
  },
  iconButton: {
    padding: 8, // p-2
  },
  exportShareCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 8, // rounded-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    padding: 16, // p-4
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // space-x-2
    paddingVertical: 12, // py-3
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    borderRadius: 8, // rounded-lg
    flex: 1,
  },
  exportButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#111827', // text-gray-900
  },
  shareAyushButton: {
    width: '100%', // w-full
    backgroundColor: '#00BFFF', // bg-primary
    paddingVertical: 12, // py-3
    borderRadius: 8, // rounded-lg
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8, // space-x-2
  },
  shareAyushButtonText: {
    color: '#FFFFFF', // text-white
    fontWeight: '500', // font-medium
  },
  mt3: {
    marginTop: 12, // mt-3
  },
  mb4: {
    marginBottom: 16,
  },
  // bottomNav: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: '#FFFFFF',
  //   borderTopWidth: 1,
  //   borderTopColor: '#E5E7EB', // border-gray-200
  //   paddingHorizontal: 20, // px-5
  //   paddingVertical: 12, // py-3
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  // },
  // navButton: {
  //   flexDirection: 'column',
  //   alignItems: 'center',
  //   gap: 4, // space-y-1
  // },
  // navButtonText: {
  //   fontSize: 12, // text-xs
  //   color: '#808080', // text-accent
  // },
  // primaryText: {
  //   color: '#00BFFF', // text-primary
  // },
});

export default ReportsAnalyticsScreen;