import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    result,
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
    <LinearGradient
      colors={['#f0fdf4', '#ecfdf5', '#f9fafb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
        
        <BottomActions
          currentStep={currentStep}
          onGenerateBatch={generateBatchId}
          isProcessing={isProcessing}
          batchId={result?.batch?.batch_id}
        />

        {currentStep === 3 && result?.qr_code ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <View style={{ width: 200, height: 200, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 3 }}>
              <Image
                source={{ uri: result.qr_code }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
});

export default HerbRegisterScreen;
