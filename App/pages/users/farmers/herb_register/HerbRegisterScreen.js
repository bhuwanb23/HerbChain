import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { useHerbRegistration } from './hooks';
import {
  Header,
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
    <SafeAreaWrapper style={styles.container} includeBottom={false}>
      <Header 
        navigation={navigation} 
        onHelpPress={handleHelpPress}
      />
      
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
    </SafeAreaWrapper>
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
