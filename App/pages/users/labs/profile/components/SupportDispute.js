import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_CATEGORIES, DISPUTE_TYPES, COLORS } from '../constants';

const CategoryCard = ({ category, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isSelected && styles.selectedCategoryCard
      ]}
      onPress={() => onSelect(category.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={category.icon} size={24} color={category.iconColor} />
      </View>
      <Text style={[
        styles.categoryTitle,
        isSelected && styles.selectedCategoryTitle
      ]}>
        {category.title}
      </Text>
      <Text style={[
        styles.categoryDescription,
        isSelected && styles.selectedCategoryDescription
      ]}>
        {category.description}
      </Text>
    </TouchableOpacity>
  );
};

const SupportDispute = ({ onSubmitIssue, onSubmitDispute }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDisputeType, setSelectedDisputeType] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [currentTab, setCurrentTab] = useState('support'); // 'support' or 'dispute'

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleDisputeTypeSelect = (disputeTypeId) => {
    setSelectedDisputeType(disputeTypeId);
  };

  const handleSubmit = () => {
    if (currentTab === 'support') {
      if (!selectedCategory || !issueDescription.trim()) {
        Alert.alert('Missing Information', 'Please select a category and provide a description.');
        return;
      }
      const issueData = {
        category: selectedCategory,
        description: issueDescription,
        contactInfo: contactInfo,
        timestamp: new Date().toISOString(),
      };
      onSubmitIssue(issueData);
    } else {
      if (!selectedDisputeType || !issueDescription.trim()) {
        Alert.alert('Missing Information', 'Please select a dispute type and provide a description.');
        return;
      }
      const disputeData = {
        type: selectedDisputeType,
        description: issueDescription,
        contactInfo: contactInfo,
        timestamp: new Date().toISOString(),
      };
      onSubmitDispute(disputeData);
    }
    
    // Reset form
    setSelectedCategory(null);
    setSelectedDisputeType(null);
    setIssueDescription('');
    setContactInfo('');
  };

  const renderSupportContent = () => (
    <View>
      <Text style={styles.sectionTitle}>What can we help you with?</Text>
      <View style={styles.categoriesGrid}>
        {SUPPORT_CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onSelect={handleCategorySelect}
          />
        ))}
      </View>
    </View>
  );

  const renderDisputeContent = () => (
    <View>
      <Text style={styles.sectionTitle}>What type of dispute do you want to file?</Text>
      <View style={styles.categoriesGrid}>
        {DISPUTE_TYPES.map((disputeType) => (
          <CategoryCard
            key={disputeType.id}
            category={disputeType}
            isSelected={selectedDisputeType === disputeType.id}
            onSelect={handleDisputeTypeSelect}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            currentTab === 'support' && styles.activeTabButton
          ]}
          onPress={() => setCurrentTab('support')}
        >
          <Ionicons 
            name="help-circle-outline" 
            size={20} 
            color={currentTab === 'support' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[
            styles.tabButtonText,
            currentTab === 'support' && styles.activeTabButtonText
          ]}>
            Support
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            currentTab === 'dispute' && styles.activeTabButton
          ]}
          onPress={() => setCurrentTab('dispute')}
        >
          <Ionicons 
            name="alert-circle-outline" 
            size={20} 
            color={currentTab === 'dispute' ? '#FFFFFF' : '#6B7280'} 
          />
          <Text style={[
            styles.tabButtonText,
            currentTab === 'dispute' && styles.activeTabButtonText
          ]}>
            Dispute
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent}>
        {currentTab === 'support' ? renderSupportContent() : renderDisputeContent()}

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {currentTab === 'support' ? 'Describe your issue' : 'Describe your dispute'}
          </Text>
          <TextInput
            style={styles.textArea}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder={`Please provide details about your ${currentTab === 'support' ? 'issue' : 'dispute'}...`}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Contact Information */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Contact Information (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholder="Email or phone number for follow-up"
            keyboardType="email-address"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={currentTab === 'support' ? 'send-outline' : 'alert-circle-outline'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.submitButtonText}>
            {currentTab === 'support' ? 'Submit Support Request' : 'File Dispute'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCategoryCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  selectedCategoryTitle: {
    color: COLORS.primary,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedCategoryDescription: {
    color: '#059669',
  },
  inputSection: {
    marginTop: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SupportDispute;