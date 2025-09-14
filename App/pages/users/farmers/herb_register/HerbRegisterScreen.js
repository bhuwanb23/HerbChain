import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useHerbRegistration } from './hooks';
import {
  ProgressBar,
  AIRecognition,
  ManualEntry,
  BottomActions,
} from './components';

const HerbRegisterScreen = ({ navigation }) => {
  const {
    currentStep,
    isProcessing,
    aiDetection,
    formData,
    handleCameraPress,
    updateFormData,
    generateBatchId,
  } = useHerbRegistration();

  const handleHelpPress = () => {
    Alert.alert(
      'Help',
      'This screen helps you register new herb batches using AI recognition and manual entry. Take a photo of your herb and the AI will automatically identify it, then fill in the remaining details.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ProgressBar currentStep={currentStep} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AIRecognition
          isProcessing={isProcessing}
          aiDetection={aiDetection}
          onCameraPress={handleCameraPress}
        />
        
        <ManualEntry
          formData={formData}
          updateFormData={updateFormData}
        />
      </ScrollView>
      
      <BottomActions
        currentStep={currentStep}
        onGenerateBatch={generateBatchId}
        isProcessing={isProcessing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});

export default HerbRegisterScreen;
