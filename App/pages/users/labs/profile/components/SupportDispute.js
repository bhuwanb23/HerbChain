import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Pressable,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT_CATEGORIES, DISPUTE_TYPES, PRIORITY_LEVELS, COLORS } from '../constants';

const CategoryCard = ({ category, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isSelected && styles.selectedCategoryCard,
        { borderColor: category.color }
      ]}
      onPress={() => onSelect(category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <Ionicons name={category.icon} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Text style={styles.categoryDescription}>{category.description}</Text>
    </TouchableOpacity>
  );
};

const PriorityButton = ({ priority, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[
        styles.priorityButton,
        isSelected && styles.selectedPriorityButton,
        { borderColor: priority.color }
      ]}
      onPress={() => onSelect(priority.id)}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
      <Text style={[
        styles.priorityText,
        isSelected && { color: priority.color, fontWeight: '600' }
      ]}>
        {priority.title}
      </Text>
    </TouchableOpacity>
  );
};

const SupportDispute = ({ onSubmitIssue, onSubmitDispute }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDisputeType, setSelectedDisputeType] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handleSubmit = () => {
    if (!selectedCategory || !issueTitle || !issueDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const issueData = {
      category: selectedCategory,
      disputeType: selectedDisputeType,
      priority: selectedPriority,
      title: issueTitle,
      description: issueDescription,
      contactInfo: contactInfo,
      timestamp: new Date().toISOString(),
    };

    if (selectedCategory === 'dispute') {
      onSubmitDispute(issueData);
    } else {
      onSubmitIssue(issueData);
    }

    // Reset form
    setSelectedCategory(null);
    setSelectedDisputeType(null);
    setSelectedPriority('medium');
    setIssueTitle('');
    setIssueDescription('');
    setContactInfo('');

    Alert.alert('Success', 'Your request has been submitted successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support & Dispute Resolution</Text>
        <Text style={styles.subtitle}>
          Select a category and provide details about your issue or dispute.
        </Text>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Category</Text>
        <View style={styles.categoriesGrid}>
          {SUPPORT_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onSelect={setSelectedCategory}
            />
          ))}
        </View>
      </View>

      {/* Dispute Type (only for disputes) */}
      {selectedCategory === 'dispute' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispute Type</Text>
          <View style={styles.disputeTypesContainer}>
            {DISPUTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.disputeTypeButton,
                  selectedDisputeType === type.id && styles.selectedDisputeTypeButton
                ]}
                onPress={() => setSelectedDisputeType(type.id)}
              >
                <Text style={[
                  styles.disputeTypeText,
                  selectedDisputeType === type.id && styles.selectedDisputeTypeText
                ]}>
                  {type.title}
                </Text>
                <Text style={styles.disputeTypeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Priority Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Level</Text>
        <View style={styles.priorityContainer}>
          {PRIORITY_LEVELS.map((priority) => (
            <PriorityButton
              key={priority.id}
              priority={priority}
              isSelected={selectedPriority === priority.id}
              onSelect={setSelectedPriority}
            />
          ))}
        </View>
      </View>

      {/* Issue Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issue Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.textInput}
            value={issueTitle}
            onChangeText={setIssueTitle}
            placeholder="Brief description of the issue"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={issueDescription}
            onChangeText={setIssueDescription}
            placeholder="Detailed description of the issue or dispute"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contact Information</Text>
          <TextInput
            style={styles.textInput}
            value={contactInfo}
            onChangeText={setContactInfo}
            placeholder="Phone number or additional contact info"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="send-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {selectedCategory === 'dispute' ? 'Submit Dispute' : 'Submit Issue'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedCategoryCard: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  disputeTypesContainer: {
    gap: 8,
  },
  disputeTypeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDisputeTypeButton: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  disputeTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  selectedDisputeTypeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  disputeTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedPriorityButton: {
    borderWidth: 2,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
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
    color: '#111827',
  },
  textArea: {
    height: 100,
  },
  submitContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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