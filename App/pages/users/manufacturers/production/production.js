import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
// Removed: import { SafeAreaView } from 'react-native-safe-area-context';
// Removed: import ProductionHeader from './components/ProductionHeader';
import ProgressBar from './components/ProgressBar';
import Step1SelectHerbs from './components/Step1SelectHerbs';
import Step2Formulation from './components/Step2Formulation';
import Step3LinkBatches from './components/Step3LinkBatches';
import Step4GenerateQR from './components/Step4GenerateQR';
import useProductCreationData from './hooks/useProductCreationData';

const ProductionPage = () => {
  const {
    currentStep,
    handleNextStep,
    handlePreviousStep,
    selectedHerbs,
    handleHerbSelection,
    herbProportions,
    handleProportionChange,
    processingMethods,
    processingMethod,
    setProcessingMethod,
    processingNotes,
    setProcessingNotes,
    linkedBatches,
    traceabilitySummaryData,
    qrCodeImageUrl,
    productId,
    handleCreateNewProduct,
    productionSteps,
  } = useProductCreationData();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1SelectHerbs
            selectedHerbs={selectedHerbs}
            onSelectHerb={handleHerbSelection}
            onNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <Step2Formulation
            selectedHerbs={selectedHerbs}
            herbProportions={herbProportions}
            onProportionChange={handleProportionChange}
            processingMethods={processingMethods}
            processingMethod={processingMethod}
            onSelectProcessingMethod={setProcessingMethod}
            processingNotes={processingNotes}
            onProcessingNotesChange={setProcessingNotes}
            onPreviousStep={handlePreviousStep}
            onNextStep={handleNextStep}
          />
        );
      case 3:
        return (
          <Step3LinkBatches
            linkedBatches={linkedBatches}
            productId={productId}
            onPreviousStep={handlePreviousStep}
            onNextStep={handleNextStep}
          />
        );
      case 4:
        return (
          <Step4GenerateQR
            qrCodeImageUrl={qrCodeImageUrl}
            productId={productId}
            traceabilitySummaryData={traceabilitySummaryData}
            onCreateNewProduct={handleCreateNewProduct}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Removed: <ProductionHeader /> */}
      <ProgressBar currentStep={currentStep} steps={productionSteps} />
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24, // py-6
  },
});

export default ProductionPage;