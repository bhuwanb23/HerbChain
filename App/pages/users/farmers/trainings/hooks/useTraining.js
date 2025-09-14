import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useTraining = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const handleLanguageChange = useCallback((languageId) => {
    setSelectedLanguage(languageId);
  }, []);

  const handleVideoPress = useCallback((video) => {
    Alert.alert(
      video.title,
      `Duration: ${video.duration}\nLanguage: ${video.language}\nCategory: ${video.category}`,
      [{ text: 'Watch Now', onPress: () => console.log('Opening video player') }]
    );
  }, []);

  const handleQuickActionPress = useCallback((action) => {
    Alert.alert(
      action.title,
      action.subtitle,
      [{ text: 'OK' }]
    );
  }, []);

  const toggleFAQ = useCallback((faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  }, [expandedFAQ]);

  const handleFloatingChatPress = useCallback(() => {
    Alert.alert(
      'Need Help?',
      'Our support team is available 24/7 to assist you.',
      [{ text: 'Start Chat', onPress: () => console.log('Opening chat') }]
    );
  }, []);

  return {
    selectedLanguage,
    expandedFAQ,
    handleLanguageChange,
    handleVideoPress,
    handleQuickActionPress,
    toggleFAQ,
    handleFloatingChatPress,
  };
};
