/**
 * Dynamic Translation API Service
 * Handles on-demand translation of dynamic content using backend translation API
 */

const API_BASE_URL = 'http://10.50.74.1:5000/api/v1/translate'; // Use your actual IP instead of localhost

class DynamicTranslationAPI {
  constructor() {
    this.cache = new Map(); // Client-side cache for translations
    this.isTranslating = new Set(); // Track ongoing translations to prevent duplicates
  }

  /**
   * Generate cache key for translation
   */
  _generateCacheKey(text, targetLang) {
    return `${text}_${targetLang}`;
  }

  /**
   * Check if text needs translation
   */
  _needsTranslation(text, targetLang) {
    return targetLang && targetLang !== 'en' && text && typeof text === 'string';
  }

  /**
   * Translate a single text string
   */
  async translateText(text, targetLang = 'en') {
    try {
      // Return original if no translation needed
      if (!this._needsTranslation(text, targetLang)) {
        return text;
      }

      // Check cache first
      const cacheKey = this._generateCacheKey(text, targetLang);
      if (this.cache.has(cacheKey)) {
        console.log('🔄 Cache hit for translation:', text.substring(0, 30) + '...');
        return this.cache.get(cacheKey);
      }

      // Prevent duplicate requests
      if (this.isTranslating.has(cacheKey)) {
        console.log('⏳ Translation in progress, waiting...', text.substring(0, 30) + '...');
        // Wait for ongoing translation
        while (this.isTranslating.has(cacheKey)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.cache.get(cacheKey) || text;
      }

      // Mark as translating
      this.isTranslating.add(cacheKey);

      console.log('🌍 Translating text to', targetLang + ':', text.substring(0, 50) + '...');

      const response = await fetch(`${API_BASE_URL}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          target_lang: targetLang,
          source_lang: 'auto'
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.translated_text) {
        // Cache the translation
        this.cache.set(cacheKey, data.translated_text);
        console.log('✅ Translation successful:', text.substring(0, 30) + '... →', data.translated_text.substring(0, 30) + '...');
        return data.translated_text;
      } else {
        console.warn('⚠️ Translation API returned no result for:', text);
        return text; // Fallback to original
      }

    } catch (error) {
      console.error('❌ Translation failed for:', text, 'Error:', error.message);
      return text; // Fallback to original text
    } finally {
      // Remove from translating set
      const cacheKey = this._generateCacheKey(text, targetLang);
      this.isTranslating.delete(cacheKey);
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(texts, targetLang = 'en') {
    try {
      // Filter texts that need translation
      const textsToTranslate = texts.filter(text => this._needsTranslation(text, targetLang));
      
      if (textsToTranslate.length === 0) {
        return texts; // Return original if no translation needed
      }

      console.log('🌍 Batch translating', textsToTranslate.length, 'texts to', targetLang);

      const response = await fetch(`${API_BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          target_lang: targetLang,
          source_lang: 'auto'
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.translated_texts) {
        // Cache all translations
        textsToTranslate.forEach((originalText, index) => {
          const translatedText = data.translated_texts[index];
          const cacheKey = this._generateCacheKey(originalText, targetLang);
          this.cache.set(cacheKey, translatedText);
        });

        // Map original texts to translated texts
        const translatedTexts = texts.map(text => {
          if (!this._needsTranslation(text, targetLang)) {
            return text;
          }
          const index = textsToTranslate.indexOf(text);
          return index !== -1 ? data.translated_texts[index] : text;
        });

        console.log('✅ Batch translation successful for', textsToTranslate.length, 'texts');
        return translatedTexts;
      } else {
        console.warn('⚠️ Batch translation API returned no result');
        return texts; // Fallback to original
      }

    } catch (error) {
      console.error('❌ Batch translation failed:', error.message);
      return texts; // Fallback to original texts
    }
  }

  /**
   * Translate payment/transaction data
   */
  async translatePaymentData(transactions, targetLang = 'en') {
    try {
      if (!this._needsTranslation('test', targetLang) || !Array.isArray(transactions)) {
        return transactions;
      }

      console.log('💰 Translating payment data to', targetLang);
      console.log('💰 API URL:', `${API_BASE_URL}/payments`);
      console.log('💰 Payload:', { transactions: transactions.length + ' transactions', target_lang: targetLang });

      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactions,
          target_lang: targetLang
        }),
      });

      console.log('💰 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('💰 API Error Response:', errorText);
        throw new Error(`Payment translation API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.translated_transactions) {
        console.log('✅ Payment data translation successful');
        return data.translated_transactions;
      } else {
        console.warn('⚠️ Payment translation API returned no result');
        return transactions; // Fallback to original
      }

    } catch (error) {
      console.error('❌ Payment data translation failed:', error.message);
      return transactions; // Fallback to original
    }
  }

  /**
   * Translate herb/batch data
   */
  async translateHerbData(herbs, targetLang = 'en') {
    try {
      if (!this._needsTranslation('test', targetLang) || !Array.isArray(herbs)) {
        return herbs;
      }

      console.log('🌿 Translating herb data to', targetLang);

      const response = await fetch(`${API_BASE_URL}/herb-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          herbs: herbs,
          target_lang: targetLang
        }),
      });

      if (!response.ok) {
        throw new Error(`Herb translation API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.translated_herbs) {
        console.log('✅ Herb data translation successful');
        return data.translated_herbs;
      } else {
        console.warn('⚠️ Herb translation API returned no result');
        return herbs; // Fallback to original
      }

    } catch (error) {
      console.error('❌ Herb data translation failed:', error.message);
      return herbs; // Fallback to original
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      translatingCount: this.isTranslating.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Translation cache cleared');
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await fetch(`${API_BASE_URL}/languages`);
      const data = await response.json();
      return data.supported_languages || {};
    } catch (error) {
      console.error('❌ Failed to get supported languages:', error.message);
      return { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu' };
    }
  }
}

// Export singleton instance
export const dynamicTranslationAPI = new DynamicTranslationAPI();
export default dynamicTranslationAPI;
