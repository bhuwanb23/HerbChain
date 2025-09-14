import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

const SupportDispute = ({ onSubmitIssue }) => {
  const [issueType, setIssueType] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const issueTypes = [
    { id: 'farmer', label: 'Farmer Issue', icon: '👨‍🌾', description: 'Problems with farmers or suppliers' },
    { id: 'transporter', label: 'Transporter Issue', icon: '🚛', description: 'Issues with transportation or delivery' },
    { id: 'compliance', label: 'Compliance Issue', icon: '📋', description: 'AYUSH standards or regulatory concerns' },
    { id: 'technical', label: 'Technical Issue', icon: '🔧', description: 'App or system problems' },
    { id: 'dispute', label: 'Dispute Resolution', icon: '⚖️', description: 'Formal dispute for regulatory intervention' },
  ];

  const mockBatches = [
    { id: 'BATCH-001', herbType: 'Ashwagandha', farmer: 'Rajesh Kumar' },
    { id: 'BATCH-002', herbType: 'Tulsi', farmer: 'Priya Sharma' },
    { id: 'BATCH-003', herbType: 'Neem', farmer: 'Amit Singh' },
  ];

  const handleSubmitIssue = () => {
    if (!issueType || !issueTitle || !issueDescription) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Submit Issue',
      'Are you sure you want to submit this issue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            const issueData = {
              type: issueType,
              title: issueTitle,
              description: issueDescription,
              batchId: selectedBatch,
              timestamp: new Date().toISOString(),
            };
            
            onSubmitIssue && onSubmitIssue(issueData);
            Alert.alert('Success', 'Issue submitted successfully!');
            
            // Reset form
            setIssueType('');
            setIssueTitle('');
            setIssueDescription('');
            setSelectedBatch('');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support & Dispute</Text>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Issue Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Issue Type</Text>
          {issueTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.issueTypeCard,
                issueType === type.id && styles.selectedIssueType
              ]}
              onPress={() => setIssueType(type.id)}
            >
              <Text style={styles.issueTypeIcon}>{type.icon}</Text>
              <View style={styles.issueTypeContent}>
                <Text style={styles.issueTypeLabel}>{type.label}</Text>
                <Text style={styles.issueTypeDescription}>{type.description}</Text>
              </View>
              {issueType === type.id && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Issue Details */}
        {issueType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issue Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Issue Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief description of the issue"
                value={issueTitle}
                onChangeText={setIssueTitle}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Detailed Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Provide detailed information about the issue..."
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                numberOfLines={6}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Related Batch (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.batchSelector}>
                  {mockBatches.map((batch) => (
                    <TouchableOpacity
                      key={batch.id}
                      style={[
                        styles.batchOption,
                        selectedBatch === batch.id && styles.selectedBatch
                      ]}
                      onPress={() => setSelectedBatch(batch.id)}
                    >
                      <Text style={styles.batchId}>{batch.id}</Text>
                      <Text style={styles.batchHerb}>{batch.herbType}</Text>
                      <Text style={styles.batchFarmer}>{batch.farmer}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Submit Button */}
        {issueType && issueTitle && issueDescription && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitIssue}
          >
            <Text style={styles.submitButtonText}>📤 Submit Issue</Text>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📞</Text>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Emergency Contact</Text>
              <Text style={styles.quickActionSubtitle}>Call AYUSH helpline</Text>
            </View>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📧</Text>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Email Support</Text>
              <Text style={styles.quickActionSubtitle}>support@herchain.com</Text>
            </View>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <Text style={styles.quickActionIcon}>📚</Text>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Help Center</Text>
              <Text style={styles.quickActionSubtitle}>FAQs and guides</Text>
            </View>
            <Text style={styles.quickActionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  scrollContainer: {
    maxHeight: 600,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  issueTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedIssueType: {
    backgroundColor: '#EFF6FF',
    borderColor: '#8B5CF6',
  },
  issueTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  issueTypeContent: {
    flex: 1,
  },
  issueTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  issueTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedIcon: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  batchSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  batchOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedBatch: {
    backgroundColor: '#EFF6FF',
    borderColor: '#8B5CF6',
  },
  batchId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  batchHerb: {
    fontSize: 11,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  batchFarmer: {
    fontSize: 10,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickActionArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});

export default SupportDispute;
