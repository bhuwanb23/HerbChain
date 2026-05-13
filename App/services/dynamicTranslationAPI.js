/**
 * No-op dynamic translation client.
 *
 * The v1 backend doesn't ship the Google-Translate-style API the prototype
 * depended on, so this module is now a pass-through: every method returns
 * the input unchanged. The static UI strings are still translated by
 * `GlobalTranslationProvider`. Re-enable real dynamic translation later by
 * setting `expo.extra.ENABLE_TRANSLATIONS = true` and wiring the backend.
 */
import { isEnabled } from '../constants/featureFlags';

const enabled = isEnabled('translations');

class NoopTranslationAPI {
  constructor() {
    this.cache = new Map();
    this.isTranslating = new Set();
  }

  async translateText(text /* , _targetLang */) {
    return text;
  }

  async translateBatch(texts /* , _targetLang */) {
    return Array.isArray(texts) ? texts : [];
  }

  async translatePaymentData(transactions /* , _targetLang */) {
    return Array.isArray(transactions) ? transactions : [];
  }

  async translateHerbData(herbs /* , _targetLang */) {
    return Array.isArray(herbs) ? herbs : [];
  }

  async getSupportedLanguages() {
    return { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu' };
  }

  getCacheStats() {
    return { cacheSize: 0, translatingCount: 0, enabled };
  }

  clearCache() {
    this.cache.clear();
  }
}

export const dynamicTranslationAPI = new NoopTranslationAPI();
export default dynamicTranslationAPI;
