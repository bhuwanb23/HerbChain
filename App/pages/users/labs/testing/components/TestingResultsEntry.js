import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  TouchableOpacity,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalTranslation } from '../../../../../language/GlobalTranslationContext';
import { TEST_TYPES, UPLOAD_TYPES, MOCK_BATCHES, COLORS } from '../constants';

const OfflineBanner = ({ isOffline }) => {
  const { t } = useGlobalTranslation();
  if (!isOffline) return null;

  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineBannerContent}>
        <Ionicons name="wifi-off" size={16} color={COLORS.warning[700]} style={styles.mr2} />
        <Text style={styles.offlineBannerText}>{t.labTesting?.workingOffline || 'Working offline - Changes will sync when connected'}</Text>
        <View style={styles.mlAuto}>
          <View style={styles.offlinePulse} />
        </View>
      </View>
    </View>
  );
};

const BatchHeaderCard = ({ batchId, isOffline }) => {
  const { t } = useGlobalTranslation();
  const batch = MOCK_BATCHES.find(b => b.id === batchId) || MOCK_BATCHES[0]; // Assuming MOCK_BATCHES is available from constants

  return (
    <View style={styles.batchHeaderCard}>
      <View style={styles.batchHeaderContent}>
        <View>
          <Text style={styles.batchHeaderTitle}>{t.labTesting?.batch || 'Batch'} #{batch.id}</Text>
          <Text style={styles.batchHeaderSubtitle}>{batch.name}</Text>
        </View>
        <View style={[styles.batchStatusTag, { backgroundColor: COLORS.info[100] }]}>
          <Text style={[styles.batchStatusText, { color: COLORS.info[700] }]}>{batch.status}</Text>
        </View>
      </View>
      <View style={styles.batchReceivedInfo}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} style={styles.mr2} />
        <Text style={styles.batchReceivedText}>{t.labTesting?.received || 'Received'}: {batch.receivedDate}</Text>
      </View>
    </View>
  );
};

const TestResultCard = ({ testType, value, onChange }) => {
  const isBoolean = testType.type === 'boolean';

  return (
    <View style={styles.testResultCard}>
      <View style={styles.testResultCardHeader}>
        <View style={[styles.testResultIconBg, { backgroundColor: testType.iconBg }]}>
          <Ionicons name={testType.icon} size={20} color={testType.iconColor} />
        </View>
        <View>
          <Text style={styles.testResultTitle}>{testType.title}</Text>
          {testType.subtitle && <Text style={styles.testResultSubtitle}>{testType.subtitle}</Text>}
        </View>
      </View>
      {isBoolean ? (
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>{testType.title}</Text>
          <Switch
            onValueChange={(newValue) => onChange(testType.id, newValue)}
            value={!!value}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primaryLight }}
            thumbColor={value ? COLORS.primary : COLORS.gray[500]}
          />
        </View>
      ) : (
        <TextInput
          style={styles.textInput}
          placeholder={testType.placeholder}
          keyboardType={testType.unit === '%' || testType.unit === 'mg/kg' || testType.step ? 'numeric' : 'default'}
          value={String(value)}
          onChangeText={(text) => onChange(testType.id, text)}
          placeholderTextColor={COLORS.gray[400]}
        />
      )}
    </View>
  );
};

const UploadCard = ({ uploadType, isUploaded, onUpload, onRemove }) => {
  const { t } = useGlobalTranslation();
  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadCardHeader}>
        <View style={styles.flexRowCenter}>
          <Ionicons name={uploadType.icon} size={20} color={uploadType.iconColor} style={styles.mr3} />
          <Text style={styles.uploadTitle}>{uploadType.title}</Text>
        </View>
        <Text style={styles.uploadSubtitle}>{uploadType.subtitle}</Text>
      </View>
      <View style={styles.uploadZone}>
        {isUploaded ? (
          <View style={styles.uploadedFileContainer}>
            <View style={styles.flexRowCenter}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} style={styles.mr2} />
              <Text style={styles.uploadedFileText}>{t.labTesting?.fileUploadedSuccessfully || 'File uploaded successfully'}</Text>
            </View>
            <Pressable onPress={() => onRemove(uploadType.id)} style={({ pressed }) => [
              pressed && styles.buttonPressed
            ]}>
              <Ionicons name="trash" size={16} color={COLORS.error} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onUpload(uploadType.id, 'mock-file')} style={({ pressed }) => [
            styles.uploadPrompt,
            pressed && styles.buttonPressed
          ]}>
            <Ionicons name="cloud-upload" size={30} color={COLORS.gray[500]} style={styles.mb2} />
            <Text style={styles.uploadPromptText}>{t.labTesting?.dragDropOrTapToUpload || 'Drag & drop or tap to upload'}</Text>
            <Text style={styles.chooseFileButton}>{t.labTesting?.chooseFile || 'Choose File'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const ActionButtons = ({ onSaveOffline, onSubmitResults, isOffline }) => {
  const { t } = useGlobalTranslation();
  return (
    <View style={styles.actionButtonsContainer}>
      <Pressable
        onPress={onSaveOffline}
        style={({ pressed }) => [
          styles.actionButton,
          styles.secondaryButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Ionicons name="save" size={20} color={COLORS.info} style={styles.mr2} />
        <Text style={styles.actionButtonTextSecondary}>{t.labTesting?.saveOffline || 'Save Offline'}</Text>
      </Pressable>
      <Pressable
        onPress={onSubmitResults}
        style={({ pressed }) => [
          styles.actionButton,
          styles.primaryButton,
          pressed && styles.buttonPressed
        ]}
      >
        <Ionicons name="paper-plane" size={20} color={COLORS.white} style={styles.mr2} />
        <Text style={styles.actionButtonTextPrimary}>{t.labTesting?.submitResults || 'Submit Results'}</Text>
      </Pressable>
    </View>
  );
};

const TestingResultsEntry = ({
  batchId,
  isOffline,
  testResults,
  uploadedFiles,
  onToggleOffline,
  onTestResultChange,
  onFileUpload,
  onFileRemove,
  onSaveOffline,
  onSubmitResults,
}) => {
  const { t } = useGlobalTranslation();
  
  // Create translated test types and upload types
  const translatedTestTypes = TEST_TYPES.map(testType => ({
    ...testType,
    title: testType.id === 'moisture' 
      ? (t.labTesting?.moistureContent || 'Moisture Content')
      : testType.id === 'pesticide'
      ? (t.labTesting?.pesticideResidues || 'Pesticide Residues')
      : testType.id === 'phytochemical'
      ? (t.labTesting?.phytochemicalLevels || 'Phytochemical Levels')
      : testType.id === 'purity_percentage'
      ? (t.labTesting?.purityPercentage || 'Purity Percentage')
      : testType.id === 'heavy_metals_present'
      ? (t.labTesting?.heavyMetalsPresent || 'Heavy Metals Present')
      : (t.labTesting?.microbialContamination || 'Microbial Contamination'),
    subtitle: testType.id === 'moisture' || testType.id === 'purity_percentage'
      ? (t.labTesting?.percentage || 'Percentage (%)')
      : testType.id === 'phytochemical'
      ? (t.labTesting?.quantitativeMarkers || 'Quantitative markers')
      : testType.id === 'heavy_metals_present'
      ? (t.labTesting?.yesNo || 'Yes/No')
      : testType.subtitle,
    placeholder: testType.id === 'moisture' || testType.id === 'purity_percentage'
      ? (t.labTesting?.enterPercentage || 'Enter percentage')
      : (t.labTesting?.enterValue || 'Enter value')
  }));
  
  const translatedUploadTypes = UPLOAD_TYPES.map(uploadType => ({
    ...uploadType,
    title: uploadType.id === 'test_reports'
      ? (t.labTesting?.testReports || 'Test Reports')
      : uploadType.id === 'lab_photos'
      ? (t.labTesting?.labPhotos || 'Lab Photos')
      : (t.labTesting?.certificates || 'Certificates'),
    subtitle: uploadType.id === 'test_reports'
      ? (t.labTesting?.uploadPDFReports || 'Upload PDF reports from equipment')
      : uploadType.id === 'lab_photos'
      ? (t.labTesting?.uploadPhotosOfSamples || 'Upload photos of samples and equipment')
      : (t.labTesting?.uploadComplianceCertificates || 'Upload compliance certificates')
  }));
  
  return (
    <View style={styles.container}>
      <OfflineBanner isOffline={isOffline} />

      <BatchHeaderCard
        batchId={batchId}
        isOffline={isOffline}
      />

      <ScrollView style={styles.mainContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t.labTesting?.enterTestResults || 'Enter Test Results'}</Text>

          {translatedTestTypes.filter(type => type.type !== 'boolean').map((testType) => (
            <TestResultCard
              key={testType.id}
              testType={testType}
              value={testResults[testType.id] || ''}
              onChange={onTestResultChange}
            />
          ))}

          {translatedTestTypes.filter(type => type.type === 'boolean').map((testType) => (
            <TestResultCard
              key={testType.id}
              testType={testType}
              value={testResults[testType.id]}
              onChange={onTestResultChange}
            />
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t.labTesting?.detailedObservations || 'Detailed Observations'}</Text>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              placeholder={t.labTesting?.addTestResultsSummary || 'Add a summary of the test results...'}
              multiline
              numberOfLines={4}
              value={testResults.results_summary || ''}
              onChangeText={(text) => onTestResultChange('results_summary', text)}
              placeholderTextColor={COLORS.gray[400]}
            />
          </View>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              placeholder={t.labTesting?.addAdditionalNotes || 'Add any additional notes...'}
              multiline
              numberOfLines={4}
              value={testResults.notes || ''}
              onChangeText={(text) => onTestResultChange('notes', text)}
              placeholderTextColor={COLORS.gray[400]}
            />
          </View>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              placeholder={t.labTesting?.enterRecommendations || 'Enter recommendations for the herb batch...'}
              multiline
              numberOfLines={4}
              value={testResults.recommendations || ''}
              onChangeText={(text) => onTestResultChange('recommendations', text)}
              placeholderTextColor={COLORS.gray[400]}
            />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t.labTesting?.uploadEvidence || 'Upload Evidence'}</Text>

          {translatedUploadTypes.map((uploadType) => (
            <UploadCard
              key={uploadType.id}
              uploadType={uploadType}
              isUploaded={!!uploadedFiles[uploadType.id]}
              onUpload={onFileUpload}
              onRemove={onFileRemove}
            />
          ))}
        </View>

        <ActionButtons
          onSaveOffline={onSaveOffline}
          onSubmitResults={onSubmitResults}
          isOffline={isOffline}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  // Offline Status Banner
  offlineBanner: {
    backgroundColor: COLORS.warning[100],
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning[500],
    padding: 12,
  },
  offlineBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 14,
    color: COLORS.warning[800],
  },
  offlinePulse: {
    width: 16,
    height: 16,
    backgroundColor: COLORS.warning[500],
    borderRadius: 9999,
  },
  // Batch Header Card
  batchHeaderCard: {
    padding: 15,
    backgroundColor: COLORS.white,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  batchHeaderContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: 15,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  batchHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  batchHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  batchStatusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: 'medium',
  },
  batchReceivedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    color: COLORS.gray[600],
  },
  batchReceivedText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 5,
  },
  // Section Container
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    paddingBottom: 10,
  },
  testResultCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  testResultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  testResultIconBg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  testResultTitle: {
    fontWeight: '600',
    color: COLORS.gray[800],
    fontSize: 15,
  },
  testResultSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  textInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    fontSize: 15,
    color: COLORS.gray[800],
  },
  textAreaCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
    color: COLORS.gray[800],
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 5,
  },
  switchText: {
    fontSize: 15,
    color: COLORS.gray[800],
  },
  uploadCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  uploadTitle: {
    fontWeight: '600',
    color: COLORS.gray[800],
    fontSize: 15,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: COLORS.gray[100],
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.success[100],
    borderRadius: 4,
    width: '100%',
  },
  uploadedFileText: {
    fontSize: 14,
    color: COLORS.success[700],
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  chooseFileButton: {
    fontSize: 14,
    fontWeight: 'medium',
    color: COLORS.info,
  },
  // Action Buttons
  actionButtonsContainer: {
    marginHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: 15,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: COLORS.info[50],
    borderWidth: 1,
    borderColor: COLORS.info[300],
  },
  actionButtonTextPrimary: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextSecondary: {
    color: COLORS.info[700],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Utility styles
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 12 },
  mb2: { marginBottom: 8 },
  mlAuto: { marginLeft: 'auto' },
  buttonPressed: {
    opacity: 0.8,
  },
});

export default TestingResultsEntry;
