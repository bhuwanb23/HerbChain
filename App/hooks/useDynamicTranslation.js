/**
 * Dynamic Translation Hook
 * Provides on-demand translation functionality for dynamic content
 */
import { useState, useCallback, useEffect } from 'react';
import { useGlobalTranslation } from '../language/GlobalTranslationContext';
import { dynamicTranslationAPI } from '../services/dynamicTranslationAPI';

export const useDynamicTranslation = () => {
  const { currentLanguage } = useGlobalTranslation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  /**
   * Translate a single text string
   */
  const translateText = useCallback(async (text) => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const translatedText = await dynamicTranslationAPI.translateText(text, currentLanguage);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error.message);
      return text; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate multiple texts in batch
   */
  const translateBatch = useCallback(async (texts) => {
    if (!Array.isArray(texts)) {
      return texts;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const translatedTexts = await dynamicTranslationAPI.translateBatch(texts, currentLanguage);
      return translatedTexts;
    } catch (error) {
      console.error('Batch translation error:', error);
      setTranslationError(error.message);
      return texts; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate payment/transaction data
   */
  const translatePaymentData = useCallback(async (transactions) => {
    if (!Array.isArray(transactions)) {
      return transactions;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const translatedTransactions = await dynamicTranslationAPI.translatePaymentData(transactions, currentLanguage);
      return translatedTransactions;
    } catch (error) {
      console.error('Payment translation error:', error);
      setTranslationError(error.message);
      return transactions; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate herb/batch data
   */
  const translateHerbData = useCallback(async (herbs) => {
    if (!Array.isArray(herbs)) {
      return herbs;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);
      
      const translatedHerbs = await dynamicTranslationAPI.translateHerbData(herbs, currentLanguage);
      return translatedHerbs;
    } catch (error) {
      console.error('Herb translation error:', error);
      setTranslationError(error.message);
      return herbs; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate object fields
   */
  const translateObject = useCallback(async (obj, fieldsToTranslate = []) => {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    try {
      setIsTranslating(true);
      setTranslationError(null);

      const translatedObj = { ...obj };
      
      // Translate specified fields
      for (const field of fieldsToTranslate) {
        if (obj[field] && typeof obj[field] === 'string') {
          translatedObj[field] = await dynamicTranslationAPI.translateText(obj[field], currentLanguage);
        }
      }

      return translatedObj;
    } catch (error) {
      console.error('Object translation error:', error);
      setTranslationError(error.message);
      return obj; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    dynamicTranslationAPI.clearCache();
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return dynamicTranslationAPI.getCacheStats();
  }, []);

  // Clear error when language changes
  useEffect(() => {
    setTranslationError(null);
  }, [currentLanguage]);

  return {
    // Translation functions
    translateText,
    translateBatch,
    translatePaymentData,
    translateHerbData,
    translateObject,
    
    // State
    isTranslating,
    translationError,
    currentLanguage,
    
    // Utility functions
    clearCache,
    getCacheStats,
  };
};
