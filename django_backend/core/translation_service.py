import logging
from typing import Dict, List
import hashlib
import time

logger = logging.getLogger(__name__)

class SimpleTranslationService:
    def __init__(self):
        self.cache = {}
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi',
            'ta': 'Tamil',
            'te': 'Telugu'
        }

    def _generate_cache_key(self, text: str, target_lang: str) -> str:
        combined = f"{text}_{target_lang}"
        return hashlib.md5(combined.encode()).hexdigest()

    def _is_supported_language(self, lang_code: str) -> bool:
        return lang_code in self.supported_languages

    def translate_text(self, text: str, target_lang: str = 'en', source_lang: str = 'auto') -> str:
        if not isinstance(text, str) or not text:
            return text
        if target_lang == 'en' or not self._is_supported_language(target_lang):
            return text
        cache_key = self._generate_cache_key(text, target_lang)
        if cache_key in self.cache:
            return self.cache[cache_key]
        # Mock translation (safe fallback)
        mock_translations = {
            'hi': {
                'pending': '\u0932\u0902\u092c\u093f\u0924',
                'completed': '\u092a\u0942\u0930\u094d\u0923'
            }
        }
        translated = mock_translations.get(target_lang, {}).get(text, text)
        self.cache[cache_key] = translated
        time.sleep(0.01)
        return translated

    def translate_batch(self, texts: List[str], target_lang: str = 'en', source_lang: str = 'auto') -> List[str]:
        return [self.translate_text(t, target_lang, source_lang) if isinstance(t, str) else t for t in texts]

    def translate_object(self, data: Dict, fields_to_translate: List[str], target_lang: str = 'en') -> Dict:
        translated = data.copy()
        for f in fields_to_translate:
            if f in data and isinstance(data[f], str):
                translated[f] = self.translate_text(data[f], target_lang)
        return translated

    def translate_list_of_objects(self, data_list: List[Dict], fields_to_translate: List[str], target_lang: str = 'en') -> List[Dict]:
        return [self.translate_object(d, fields_to_translate, target_lang) for d in data_list]

    def get_cache_stats(self):
        return {'cache_size': len(self.cache), 'supported_languages': self.supported_languages}

    def clear_cache(self):
        self.cache.clear()


translation_service = SimpleTranslationService()
