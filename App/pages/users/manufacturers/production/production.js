import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native'; // Import Alert
import Icon from 'react-native-vector-icons/MaterialIcons';
// Removed: import { SafeAreaView } from 'react-native-safe-area-context';
// Removed: import ProductionHeader from './components/ProductionHeader';
import ProgressBar from './components/ProgressBar';
import Step1SelectHerbs from './components/Step1SelectHerbs';
import Step2Formulation from './components/Step2Formulation';
import Step3LinkBatches from './components/Step3LinkBatches';
import Step4GenerateQR from './components/Step4GenerateQR';
import ProductList from './components/ProductList';
import ProductDetails from './components/ProductDetails';
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
    currentView,
    startNewProductCreation,
    viewProductDetails,
    backToProductList,
    selectedProductForDetails,
    productList,
  } = useProductCreationData();

  const renderProductionForm = () => {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View> {/* Wrap ProgressBar and content in a View */}
          <ProgressBar currentStep={currentStep} steps={productionSteps} />
          {
            (() => {
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
                      onCreateNewProduct={() => {
                        handleCreateNewProduct();
                        Alert.alert('Product Created', 'Your new product has been successfully created!');
                      }}
                    />
                  );
                default:
                  return null;
              }
            })()
          }
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (currentView === 'list') {
      return (
        <ProductList products={productList} onViewDetails={viewProductDetails} />
      );
    } else if (currentView === 'details') {
      return (
        <ProductDetails product={selectedProductForDetails} onBackPress={backToProductList} />
      );
    } else if (currentView === 'create') {
      return (
        <View style={styles.creationPageContainer}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={backToProductList} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#4b5563" />
              <Text style={styles.backButtonText}>Back to Products</Text>
            </TouchableOpacity>
          </View>
          {renderProductionForm()}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      {currentView === 'list' && (
        <TouchableOpacity style={styles.fab} onPress={startNewProductCreation}>
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  creationPageContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4b5563',
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#059669',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default ProductionPage;