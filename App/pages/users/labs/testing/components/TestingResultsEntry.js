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
import { TEST_TYPES, UPLOAD_TYPES, MOCK_BATCHES, COLORS } from '../constants';

const OfflineBanner = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineBannerContent}>
        <Ionicons name="wifi-off" size={16} color="#B45309" style={styles.mr2} />
        <Text style={styles.offlineBannerText}>Working offline - Changes will sync when connected</Text>
        <View style={styles.mlAuto}>
          <View style={styles.offlinePulse} />
        </View>
      </View>
    </View>
  );
};

const BatchHeaderCard = ({ batchId, onToggleOffline, isOffline }) => {
  const batch = MOCK_BATCHES.find(b => b.id === batchId) || MOCK_BATCHES[0];

  return (
    <View style={styles.batchHeaderCard}>
      <View style={styles.batchHeaderContent}>
        <View>
          <Text style={styles.batchHeaderTitle}>Batch #{batch.id}</Text>
          <Text style={styles.batchHeaderSubtitle}>{batch.name}</Text>
        </View>
        <View style={styles.batchStatusTag}>
          <Text style={styles.batchStatusText}>{batch.status}</Text>
        </View>
      </View>
      <View style={styles.batchReceivedInfo}>
        <Ionicons name="calendar-outline" size={16} color="#808080" style={styles.mr2} />
        <Text style={styles.batchReceivedText}>Received: {batch.receivedDate}</Text>
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
          <Text style={styles.testResultSubtitle}>{testType.subtitle}</Text>
        </View>
      </View>
      {isBoolean ? (
        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>{testType.title}</Text>
          <Switch
            onValueChange={(newValue) => onChange(testType.id, newValue)}
            value={!!value}
          />
        </View>
      ) : (
        <TextInput 
          style={styles.textInput}
          placeholder={testType.placeholder}
          keyboardType={testType.unit === '%' || testType.unit === 'mg/kg' || testType.step ? 'numeric' : 'default'}
          value={value}
          onChangeText={(text) => onChange(testType.id, text)}
        />
      )}
    </View>
  );
};

const UploadCard = ({ uploadType, isUploaded, onUpload, onRemove }) => {
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
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={styles.mr2} />
              <Text style={styles.uploadedFileText}>File uploaded successfully</Text>
            </View>
            <Pressable onPress={() => onRemove(uploadType.id)} style={({ pressed }) => [
              pressed && styles.buttonPressed
            ]}>
              <Ionicons name="trash" size={16} color="#EF4444" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onUpload(uploadType.id, 'mock-file')} style={({ pressed }) => [
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
  );
};

const ActionButtons = ({ onSaveOffline, onSubmitResults, isOffline }) => {
  return (
    <View style={styles.actionButtonsContainer}>
      <Pressable 
        onPress={onSaveOffline} 
        style={({ pressed }) => [
          styles.actionButton,
          styles.grayBg,
          pressed && styles.buttonPressed
        ]}
      >
        <Ionicons name="save" size={20} color="#4B5563" style={styles.mr2} />
        <Text style={styles.actionButtonTextGray}>Save Offline</Text>
      </Pressable>
      <Pressable 
        onPress={onSubmitResults} 
        style={({ pressed }) => [
          styles.actionButton,
          styles.skyBlueBg,
          pressed && styles.buttonPressed
        ]}
      >
        <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.mr2} />
        <Text style={styles.actionButtonTextWhite}>Submit Results</Text>
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
  return (
    <View style={styles.container}>
      <OfflineBanner isOffline={isOffline} />
      
      <BatchHeaderCard 
        batchId={batchId}
        onToggleOffline={onToggleOffline}
        isOffline={isOffline}
      />

      <ScrollView style={styles.mainContent}>
        {/* Test Results Entry */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Enter Test Results</Text>
          
          {TEST_TYPES.filter(type => type.type !== 'boolean').map((testType) => (
            <TestResultCard
              key={testType.id}
              testType={testType}
              value={testResults[testType.id] || ''}
              onChange={onTestResultChange}
            />
          ))}

          {/* Boolean/Toggle Fields */}
          {TEST_TYPES.filter(type => type.type === 'boolean').map((testType) => (
            <TestResultCard
              key={testType.id}
              testType={testType}
              value={testResults[testType.id]}
              onChange={onTestResultChange}
            />
          ))}

          {/* Special Observations */}
          <View style={styles.testResultCard}>
            <Text style={styles.testResultTitle}>Special Observations</Text>
            <TextInput 
              style={styles.textArea}
              placeholder="Add notes or observations..."
              multiline
              numberOfLines={4}
              value={testResults.results_summary || ''}
              onChangeText={(text) => onTestResultChange('results_summary', text)}
            />
          </View>
          {/* Notes */}
          <View style={styles.testResultCard}>
            <Text style={styles.testResultTitle}>Notes</Text>
            <TextInput 
              style={styles.textArea}
              placeholder="Add additional notes..."
              multiline
              numberOfLines={4}
              value={testResults.notes || ''}
              onChangeText={(text) => onTestResultChange('notes', text)}
            />
          </View>
          {/* Recommendations */}
          <View style={styles.testResultCard}>
            <Text style={styles.testResultTitle}>Recommendations</Text>
            <TextInput 
              style={styles.textArea}
              placeholder="Add recommendations..."
              multiline
              numberOfLines={4}
              value={testResults.recommendations || ''}
              onChangeText={(text) => onTestResultChange('recommendations', text)}
            />
          </View>

        </View>

        {/* Upload Evidence */}
        <View style={styles.sectionPadding}>
          <Text style={styles.sectionTitle}>Upload Evidence</Text>
          
          {UPLOAD_TYPES.map((uploadType) => (
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
    backgroundColor: '#F9FAFB',
  },
  // Offline Status Banner
  offlineBanner: {
    backgroundColor: '#FEF9C3',
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
    padding: 12,
  },
  offlineBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBannerText: {
    fontSize: 14,
    color: '#A16207',
  },
  offlinePulse: {
    width: 16,
    height: 16,
    backgroundColor: '#EAB308',
    borderRadius: 9999,
  },
  // Batch Header Card
  batchHeaderCard: {
    padding: 20,
  },
  batchHeaderContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batchHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  batchHeaderSubtitle: {
    fontSize: 14,
    color: '#808080',
  },
  batchStatusTag: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: 'medium',
    color: '#B45309',
  },
  batchReceivedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 14,
    color: '#808080',
  },
  batchReceivedText: {
    fontSize: 14,
    color: '#808080',
  },
  // Test Results Entry & Upload Evidence Sections
  sectionPadding: { 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  testResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testResultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testResultIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  testResultTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  testResultSubtitle: {
    fontSize: 14,
    color: '#808080',
  },
  textInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 16,
    color: '#111827',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  uploadTitle: {
    fontWeight: 'medium',
    color: '#111827',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#808080',
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    width: '100%',
  },
  uploadedFileText: {
    fontSize: 14,
    color: '#16A34A',
  },
  uploadPrompt: {
    alignItems: 'center',
  },
  uploadPromptText: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 8,
  },
  chooseFileButton: {
    fontSize: 14,
    fontWeight: 'medium',
    color: '#00BFFF',
  },
  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  grayBg: { 
    backgroundColor: '#E5E7EB' 
  },
  skyBlueBg: { 
    backgroundColor: '#00BFFF' 
  },
  actionButtonTextGray: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: 'medium',
  },
  actionButtonTextWhite: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'medium',
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
