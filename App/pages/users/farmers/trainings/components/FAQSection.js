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
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  faqList: {
    gap: 6,
  },
  faqItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  question: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  faqContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  answer: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});

export default FAQSection;
