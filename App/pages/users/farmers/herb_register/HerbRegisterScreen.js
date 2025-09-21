import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGlobalTranslation } from '../../../../language/GlobalTranslationContext';
import { useHerbRegistration } from './hooks';
import {
  ProgressBar,
  AIRecognition,
  ManualEntry,
  BottomActions,
} from './components';

const HerbRegisterScreen = ({ navigation, onBack }) => {
  const { t } = useGlobalTranslation();
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
      t.herbRegister.help,
      t.herbRegister.helpMessage,
      [{ text: t.herbRegister.ok }]
    );
  };

  return (
    <LinearGradient
      colors={['#f0fdf4', '#ecfdf5', '#f9fafb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (onBack ? onBack() : (navigation?.goBack && navigation.goBack()))} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.herbRegister.herbRegistration}</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
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
