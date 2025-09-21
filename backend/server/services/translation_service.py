"""
Translation service using Google Translate (free googletrans library)
Provides dynamic translation with caching and fallback support
"""
import logging
from typing import Dict, List, Optional, Union
import time
import hashlib

# Try to import googletrans, fallback to deep-translator if not available
try:
    from googletrans import Translator
    TRANSLATOR_TYPE = 'googletrans'
except ImportError:
    try:
        from deep_translator import GoogleTranslator
        TRANSLATOR_TYPE = 'deep_translator'
    except ImportError:
        TRANSLATOR_TYPE = 'none'
        print("Warning: No translation library available. Install googletrans==3.1.0a0 or deep-translator")

# Configure logging
logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.cache = {}  # In-memory cache for translations
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi', 
            'ta': 'Tamil',
            'te': 'Telugu'
        }
        
        # Initialize translator based on available library
        if TRANSLATOR_TYPE == 'googletrans':
            self.translator = Translator()
        elif TRANSLATOR_TYPE == 'deep_translator':
            self.translator = None  # Will be created per request
        else:
            self.translator = None
            logger.warning("No translation library available")
        
    def _generate_cache_key(self, text: str, target_lang: str) -> str:
        """Generate a unique cache key for text and target language"""
        combined = f"{text}_{target_lang}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def _is_supported_language(self, lang_code: str) -> bool:
        """Check if language is supported"""
        return lang_code in self.supported_languages
    
    def translate_text(self, text: str, target_lang: str = 'en', source_lang: str = 'auto') -> str:
        """
        Translate a single text string
        
        Args:
            text: Text to translate
            target_lang: Target language code (en, hi, ta, te)
            source_lang: Source language code (auto for auto-detection)
            
        Returns:
            Translated text or original text if translation fails
        """
        try:
            # Return original text if target is English or not supported
            if target_lang == 'en' or not self._is_supported_language(target_lang):
                return text
            
            # Return original if no translator available
            if TRANSLATOR_TYPE == 'none':
                logger.warning("No translation library available, using mock translation")
                # Mock translation for testing
                mock_translations = {
                    'hi': {
                        'Ayurvedic Wellness Corp': 'आयुर्वेदिक वेलनेस कॉर्प',
                        'Premium quality herbs': 'प्रीमियम गुणवत्ता जड़ी बूटी',
                        'pending': 'लंबित',
                        'completed': 'पूर्ण'
                    }
                }
                return mock_translations.get(target_lang, {}).get(text, text)
            
            # Check cache first
            cache_key = self._generate_cache_key(text, target_lang)
            if cache_key in self.cache:
                logger.info(f"Cache hit for translation: {text[:50]}...")
                return self.cache[cache_key]
            
            logger.info(f"Translating text to {target_lang}: {text[:50]}...")
            
            # Translate using available library
            if TRANSLATOR_TYPE == 'googletrans':
                result = self.translator.translate(text, dest=target_lang, src=source_lang)
                if result and result.text:
                    translated_text = result.text
                else:
                    logger.warning(f"Googletrans returned empty result for: {text}")
                    return text
                    
            elif TRANSLATOR_TYPE == 'deep_translator':
                # Map language codes for deep-translator
                lang_map = {'hi': 'hindi', 'ta': 'tamil', 'te': 'telugu', 'en': 'english'}
                target_lang_name = lang_map.get(target_lang, target_lang)
                
                translator = GoogleTranslator(source='auto', target=target_lang_name)
                translated_text = translator.translate(text)
                
                if not translated_text:
                    logger.warning(f"Deep-translator returned empty result for: {text}")
                    return text
            else:
                return text
            
            # Cache the translation
            self.cache[cache_key] = translated_text
            logger.info(f"Translation successful: {text[:30]}... -> {translated_text[:30]}...")
            return translated_text
                
        except Exception as e:
            logger.error(f"Translation failed for text '{text}' to {target_lang}: {str(e)}")
            return text  # Fallback to original text
    
    def translate_batch(self, texts: List[str], target_lang: str = 'en', source_lang: str = 'auto') -> List[str]:
        """
        Translate multiple texts in batch
        
        Args:
            texts: List of texts to translate
            target_lang: Target language code
            source_lang: Source language code
            
        Returns:
            List of translated texts
        """
        translated_texts = []
        
        for text in texts:
            if not text or not isinstance(text, str):
                translated_texts.append(text)  # Keep non-string values as is
                continue
                
            translated_text = self.translate_text(text, target_lang, source_lang)
            translated_texts.append(translated_text)
            
            # Small delay to avoid rate limiting
            time.sleep(0.1)
        
        return translated_texts
    
    def translate_object(self, data: Dict, fields_to_translate: List[str], target_lang: str = 'en') -> Dict:
        """
        Translate specific fields in a dictionary object
        
        Args:
            data: Dictionary containing data to translate
            fields_to_translate: List of field names to translate
            target_lang: Target language code
            
        Returns:
            Dictionary with translated fields
        """
        translated_data = data.copy()
        
        for field in fields_to_translate:
            if field in data and isinstance(data[field], str):
                translated_data[field] = self.translate_text(data[field], target_lang)
        
        return translated_data
    
    def translate_list_of_objects(self, data_list: List[Dict], fields_to_translate: List[str], target_lang: str = 'en') -> List[Dict]:
        """
        Translate specific fields in a list of dictionary objects
        
        Args:
            data_list: List of dictionaries containing data to translate
            fields_to_translate: List of field names to translate
            target_lang: Target language code
            
        Returns:
            List of dictionaries with translated fields
        """
        translated_list = []
        
        for data in data_list:
            translated_data = self.translate_object(data, fields_to_translate, target_lang)
            translated_list.append(translated_data)
        
        return translated_list
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            'cache_size': len(self.cache),
            'supported_languages': self.supported_languages
        }
    
    def clear_cache(self):
        """Clear translation cache"""
        self.cache.clear()
        logger.info("Translation cache cleared")

# Global translation service instance
translation_service = TranslationService()
