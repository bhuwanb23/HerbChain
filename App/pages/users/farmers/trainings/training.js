import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaWrapper } from '../../../../components';
import { useTraining } from './hooks';
import {
  TRAINING_STATS,
  FEATURED_VIDEO,
  TRAINING_VIDEOS,
  SUPPORTED_LANGUAGES,
  QUICK_ACTIONS,
  FAQ_DATA,
} from './constants';
import {
  HeroSection,
  FeaturedVideo,
  VideoGrid,
  LanguageFilter,
  QuickActions,
  FAQSection,
  FloatingChatButton,
} from './components';

const TrainingScreen = ({ navigation }) => {
  const {
    selectedLanguage,
    expandedFAQ,
    handleLanguageChange,
    handleVideoPress,
    handleQuickActionPress,
    toggleFAQ,
    handleFloatingChatPress,
  } = useTraining();

  return (
    <SafeAreaWrapper style={styles.container} includeBottom={true}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection stats={TRAINING_STATS} />
        
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training Resources</Text>
              <Text style={styles.viewAllText}>View All</Text>
            </View>
            
            <FeaturedVideo video={FEATURED_VIDEO} onPress={handleVideoPress} />
            
            <VideoGrid videos={TRAINING_VIDEOS} onVideoPress={handleVideoPress} />
            
            <LanguageFilter
              languages={SUPPORTED_LANGUAGES}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </View>
          
          <View style={styles.supportSection}>
            <Text style={styles.sectionTitle}>Help & Support</Text>
            
            <QuickActions
              actions={QUICK_ACTIONS}
              onActionPress={handleQuickActionPress}
            />
            
            <FAQSection
              faqs={FAQ_DATA}
              expandedFAQ={expandedFAQ}
              onToggleFAQ={toggleFAQ}
            />
          </View>
        </View>
      </ScrollView>
      
      <FloatingChatButton onPress={handleFloatingChatPress} />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Add padding to prevent content from going behind navbar
  },
  content: {
    paddingHorizontal: 16,
  },
  section: {
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
  },
  supportSection: {
    backgroundColor: 'white',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: -16,
  },
});

export default TrainingScreen;
