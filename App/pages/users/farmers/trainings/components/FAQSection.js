import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FAQSection = ({ faqs, expandedFAQ, onToggleFAQ }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frequently Asked Questions</Text>
      
      <View style={styles.faqList}>
        {faqs.map((faq) => (
          <View key={faq.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => onToggleFAQ(faq.id)}
            >
              <Text style={styles.question}>{faq.question}</Text>
              <Icon
                name={expandedFAQ === faq.id ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
            
            {expandedFAQ === faq.id && (
              <View style={styles.faqContent}>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default FAQSection;
