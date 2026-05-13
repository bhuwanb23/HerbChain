import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TestingResultsEntryScreen = () => {
  const navigation = useNavigation();
  const [isOffline, setIsOffline] = useState(false);
  const [labCertificateUploaded, setLabCertificateUploaded] = useState(false);
  const [microscopeImageUploaded, setMicroscopeImageUploaded] = useState(false);
  const [chromatogramUploaded, setChromatogramUploaded] = useState(false);

  const toggleOfflineMode = () => {
    setIsOffline(prev => !prev);
  };

  const simulateFileUpload = (setter) => {
    setter(true);
    console.log('File uploaded!');
  };

  const removeFile = (setter) => {
    setter(false);
    console.log('File removed!');
  };

  return (
    <View style={styles.container}>
      {/* Offline Status Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineBannerContent}>
            <Ionicons name="wifi-off" size={16} color="#B45309" style={styles.mr2} />
            <Text style={styles.offlineBannerText}>Working offline - Changes will sync when connected</Text>
            <View style={styles.mlAuto}>
              <View style={styles.offlinePulse}></View>
            </View>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flexRowCenter}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [
            styles.mr3,
            pressed && styles.buttonPressed
          ]}>
            <Ionicons name="arrow-back" size={20} color="#808080" />
          </Pressable>
          <Text style={styles.headerTitle}>Testing & Results</Text>
        </View>
        <View style={styles.flexRowCenter}>
          <Pressable onPress={toggleOfflineMode} style={({ pressed }) => [
            styles.wifiStatusIconContainer,
            pressed && styles.buttonPressed
          ]}>
            <Ionicons name={isOffline ? "wifi-off" : "wifi"} size={14} color={isOffline ? "#B45309" : "#16A34A"} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.mainContent}>
        {/* Batch Header Card */}
        <View style={styles.batchHeaderCard}>
          <View style={styles.batchHeaderContent}>
            <View>
              <Text style={styles.batchHeaderTitle}>Batch #BT-2024-001</Text>
              <Text style={styles.batchHeaderSubtitle}>Echinacea Purpurea Extract</Text>
            </View>
            <View style={styles.batchStatusTag}>
              <Text style={styles.batchStatusText}>Testing</Text>
            </View>
          </View>
          <View style={styles.batchReceivedInfo}>
            <Ionicons name="calendar-outline" size={16} color="#808080" style={styles.mr2} />
            <Text style={styles.batchReceivedText}>Received: Jan 15, 2024</Text>
          </View>
        </View>

        {/* Test Results Entry */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Enter Test Results</Text>
          
          {/* Moisture Content */}
          <View style={styles.testResultCard}>
            <View style={styles.testResultCardHeader}>
              <View style={[styles.testResultIconBg, styles.blue100Bg]}>
                <Ionicons name="water" size={20} color="#00BFFF" />
              </View>
              <View>
                <Text style={styles.testResultTitle}>Moisture Content</Text>
                <Text style={styles.testResultSubtitle}>Percentage (%)</Text>
              </View>
            </View>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter value"
              keyboardType="numeric"
              step="0.01"
            />
          </View>

          {/* Pesticide Residues */}
          <View style={styles.testResultCard}>
            <View style={styles.testResultCardHeader}>
              <View style={[styles.testResultIconBg, styles.red100Bg]}>
                <Ionicons name="skull" size={20} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.testResultTitle}>Pesticide Residues</Text>
                <Text style={styles.testResultSubtitle}>mg/kg</Text>
              </View>
            </View>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter value"
              keyboardType="numeric"
              step="0.001"
            />
          </View>

          {/* Phytochemical Levels */}
          <View style={styles.testResultCard}>
            <View style={styles.testResultCardHeader}>
              <View style={[styles.testResultIconBg, styles.green100Bg]}>
                <Ionicons name="leaf" size={20} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.testResultTitle}>Phytochemical Levels</Text>
                <Text style={styles.testResultSubtitle}>Quantitative markers</Text>
              </View>
            </View>
            <TextInput 
              style={styles.textInput}
              placeholder="Enter value"
              keyboardType="numeric"
              step="0.01"
            />
          </View>

          {/* Special Observations */}
          <View style={styles.testResultCard}>
            <Text style={styles.testResultTitle}>Special Observations</Text>
            <TextInput 
              style={styles.textArea}
              placeholder="Add notes or observations..."
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Upload Evidence */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Upload Evidence</Text>
          
          {/* Lab Certificate */}
          <View style={styles.uploadCard}>
            <View style={styles.uploadCardHeader}>
              <View style={styles.flexRowCenter}>
                <Ionicons name="document-lock" size={20} color="#EF4444" style={styles.mr3} />
                <Text style={styles.uploadTitle}>Lab Certificate</Text>
              </View>
              <Text style={styles.uploadSubtitle}>PDF</Text>
            </View>
            <View style={styles.uploadZone}>
              {labCertificateUploaded ? (
                <View style={styles.uploadedFileContainer}>
                  <View style={styles.flexRowCenter}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={styles.mr2} />
                    <Text style={styles.uploadedFileText}>File uploaded successfully</Text>
                  </View>
                  <Pressable onPress={() => removeFile(setLabCertificateUploaded)} style={({ pressed }) => [
                    pressed && styles.buttonPressed
                  ]}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => simulateFileUpload(setLabCertificateUploaded)} style={({ pressed }) => [
                  styles.uploadPrompt,
                  pressed && styles.buttonPressed
                ]}>
                  <Ionicons name="cloud-upload" size={30} color="#808080" style={styles.mb2} />
                  <Text style={styles.uploadPromptText}>Drag & drop or tap to upload</Text>
                  <Text style={styles.chooseFileButton}>Choose File</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Microscope Image */}
          <View style={styles.uploadCard}>
            <View style={styles.uploadCardHeader}>
              <View style={styles.flexRowCenter}>
                <Ionicons name="search" size={20} color="#A855F7" style={styles.mr3} />
                <Text style={styles.uploadTitle}>Microscope Image</Text>
              </View>
              <Text style={styles.uploadSubtitle}>JPG/PNG</Text>
            </View>
            <View style={styles.uploadZone}>
              {microscopeImageUploaded ? (
                <View style={styles.uploadedFileContainer}>
                  <View style={styles.flexRowCenter}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={styles.mr2} />
                    <Text style={styles.uploadedFileText}>File uploaded successfully</Text>
                  </View>
                  <Pressable onPress={() => removeFile(setMicroscopeImageUploaded)} style={({ pressed }) => [
                    pressed && styles.buttonPressed
                  ]}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => simulateFileUpload(setMicroscopeImageUploaded)} style={({ pressed }) => [
                  styles.uploadPrompt,
                  pressed && styles.buttonPressed
                ]}>
                  <Ionicons name="cloud-upload" size={30} color="#808080" style={styles.mb2} />
                  <Text style={styles.uploadPromptText}>Drag & drop or tap to upload</Text>
                  <Text style={styles.chooseFileButton}>Choose File</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Chromatogram */}
          <View style={styles.uploadCard}>
            <View style={styles.uploadCardHeader}>
              <View style={styles.flexRowCenter}>
                <Ionicons name="analytics" size={20} color="#3B82F6" style={styles.mr3} />
                <Text style={styles.uploadTitle}>Chromatogram</Text>
              </View>
              <Text style={styles.uploadSubtitle}>Image/CSV</Text>
            </View>
            <View style={styles.uploadZone}>
              {chromatogramUploaded ? (
                <View style={styles.uploadedFileContainer}>
                  <View style={styles.flexRowCenter}>
                    <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={styles.mr2} />
                    <Text style={styles.uploadedFileText}>File uploaded successfully</Text>
                  </View>
                  <Pressable onPress={() => removeFile(setChromatogramUploaded)} style={({ pressed }) => [
                    pressed && styles.buttonPressed
                  ]}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => simulateFileUpload(setChromatogramUploaded)} style={({ pressed }) => [
                  styles.uploadPrompt,
                  pressed && styles.buttonPressed
                ]}>
                  <Ionicons name="cloud-upload" size={30} color="#808080" style={styles.mb2} />
                  <Text style={styles.uploadPromptText}>Drag & drop or tap to upload</Text>
                  <Text style={styles.chooseFileButton}>Choose File</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable onPress={() => console.log('Save Offline Pressed')} style={({ pressed }) => [
            styles.actionButton,
            styles.grayBg,
            pressed && styles.buttonPressed
          ]}>
            <Ionicons name="save" size={20} color="#4B5563" style={styles.mr2} />
            <Text style={styles.actionButtonTextGray}>Save Offline</Text>
          </Pressable>
          <Pressable onPress={() => console.log('Submit Results Pressed')} style={({ pressed }) => [
            styles.actionButton,
            styles.skyBlueBg,
            pressed && styles.buttonPressed
          ]}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.mr2} />
            <Text style={styles.actionButtonTextWhite}>Submit Results</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={({ pressed }) => [
          styles.navButton,
          pressed && styles.buttonPressed
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
    backgroundColor: '#F9FAFB', // gray-50
  },
  // Offline Status Banner
  offlineBanner: {
    backgroundColor: '#FEF9C3', // yellow-100
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308', // yellow-500
    padding: 12, // p-3
  },
  offlineBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 14,
    color: '#A16207', // yellow-700
  },
  offlinePulse: {
    width: 16, // w-4
    height: 16, // h-4
    backgroundColor: '#EAB308', // yellow-500
    borderRadius: 9999,
    // animate-pulse (React Native doesn't have direct CSS animations like Tailwind. Will need a separate animation implementation if full animation is desired)
  },
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // gray-200
    padding: 20, // p-5
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mlAuto: { marginLeft: 'auto' },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  wifiStatusIconContainer: {
    width: 32, // w-8
    height: 32, // h-8
    backgroundColor: '#DCFCE7', // green-100 (default online)
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Batch Header Card
  batchHeaderCard: {
    padding: 20, // p-5
  },
  batchHeaderContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    padding: 20, // p-5
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // mb-3
  },
  batchHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  batchHeaderSubtitle: {
    fontSize: 14,
    color: '#808080', // dark-grey
  },
  batchStatusTag: {
    backgroundColor: '#FEF9C3', // yellow-100
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#B45309', // yellow-800
  },
  batchReceivedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    color: '#808080', // dark-grey
  },
  batchReceivedText: {
    fontSize: 14,
    color: '#808080', // dark-grey
  },
  // Test Results Entry & Upload Evidence Sections
  sectionPadding: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 16, // mb-4
  },
  testResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    padding: 16,
    marginBottom: 16, // mb-4
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testResultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // mb-3
  },
  testResultIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // mr-3
  },
  blue100Bg: { backgroundColor: '#DBEAFE' }, // blue-100
  red100Bg: { backgroundColor: '#FEE2E2' }, // red-100
  green100Bg: { backgroundColor: '#DCFCE7' }, // green-100
  testResultTitle: {
    fontWeight: 'bold',
    color: '#111827', // gray-900
  },
  testResultSubtitle: {
    fontSize: 14,
    color: '#808080', // dark-grey
  },
  textInput: {
    width: '100%',
    padding: 12, // p-3
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    fontSize: 16, // text-base
  },
  textArea: {
    width: '100%',
    padding: 12, // p-3
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    fontSize: 16, // text-base
    height: 80, // h-20
    textAlignVertical: 'top',
    resizeMode: 'none', // resize-none in web usually means no user resize
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    padding: 16,
    marginBottom: 16, // mb-4 or mb-6 for last one
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // mb-3
  },
  uploadTitle: {
    fontWeight: 'medium',
    color: '#111827', // gray-900
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#808080', // dark-grey
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 8,
    padding: 24, // p-6
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12, // p-3
    backgroundColor: '#F0FDF4', // green-50
    borderRadius: 4, // rounded
    width: '100%',
  },
  uploadedFileText: {
    fontSize: 14,
    color: '#16A34A', // green-700
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptText: {
    fontSize: 14,
    color: '#808080', // dark-grey
    marginBottom: 8, // mb-2
  },
  chooseFileButton: {
    fontSize: 14,
    fontWeight: 'medium',
    color: '#00BFFF', // sky-blue
  },
  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80, // pb-20
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16, // py-4
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12, // space-y-3
  },
  grayBg: { backgroundColor: '#E5E7EB' }, // gray-200
  skyBlueBg: { backgroundColor: '#00BFFF' }, // sky-blue
  actionButtonTextGray: {
    color: '#4B5563', // gray-700
    fontSize: 16,
    fontWeight: 'medium',
  },
  actionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'medium',
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
  buttonPressed: {
    opacity: 0.8,
  },
});

export default TestingResultsEntryScreen;