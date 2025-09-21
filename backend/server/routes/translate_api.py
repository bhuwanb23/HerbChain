"""
Translation API endpoints for dynamic content translation
"""
from flask import Blueprint, request, jsonify
import logging
from services.translation_service import translation_service

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
translate_api_bp = Blueprint('translate_api', __name__, url_prefix='/api/v1/translate')

@translate_api_bp.route('/text', methods=['POST'])
def translate_text():
    """
    Translate a single text string
    
    Request body:
    {
        "text": "Hello World",
        "target_lang": "hi",
        "source_lang": "auto"  // optional
    }
    
    Response:
    {
        "original_text": "Hello World",
        "translated_text": "नमस्ते दुनिया",
        "target_lang": "hi",
        "success": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data or 'target_lang' not in data:
            return jsonify({
                'error': 'Missing required fields: text, target_lang',
                'success': False
            }), 400
        
        text = data['text']
        target_lang = data['target_lang']
        source_lang = data.get('source_lang', 'auto')
        
        # Validate inputs
        if not isinstance(text, str) or not text.strip():
            return jsonify({
                'error': 'Text must be a non-empty string',
                'success': False
            }), 400
        
        # Translate text
        translated_text = translation_service.translate_text(text, target_lang, source_lang)
        
        return jsonify({
            'original_text': text,
            'translated_text': translated_text,
            'target_lang': target_lang,
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Error in translate_text endpoint: {str(e)}")
        return jsonify({
            'error': 'Translation service error',
            'success': False
        }), 500

@translate_api_bp.route('/batch', methods=['POST'])
def translate_batch():
    """
    Translate multiple texts in batch
    
    Request body:
    {
        "texts": ["Hello", "World", "How are you?"],
        "target_lang": "hi",
        "source_lang": "auto"  // optional
    }
    
    Response:
    {
        "original_texts": ["Hello", "World", "How are you?"],
        "translated_texts": ["नमस्ते", "दुनिया", "आप कैसे हैं?"],
        "target_lang": "hi",
        "success": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data or 'target_lang' not in data:
            return jsonify({
                'error': 'Missing required fields: texts, target_lang',
                'success': False
            }), 400
        
        texts = data['texts']
        target_lang = data['target_lang']
        source_lang = data.get('source_lang', 'auto')
        
        # Validate inputs
        if not isinstance(texts, list):
            return jsonify({
                'error': 'Texts must be a list',
                'success': False
            }), 400
        
        # Translate texts
        translated_texts = translation_service.translate_batch(texts, target_lang, source_lang)
        
        return jsonify({
            'original_texts': texts,
            'translated_texts': translated_texts,
            'target_lang': target_lang,
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Error in translate_batch endpoint: {str(e)}")
        return jsonify({
            'error': 'Translation service error',
            'success': False
        }), 500

@translate_api_bp.route('/payments', methods=['POST'])
def translate_payment_data():
    """
    Translate payment/transaction data specifically
    
    Request body:
    {
        "transactions": [
            {
                "id": "TXN001",
                "buyer": "Ayurvedic Wellness Corp",
                "amount": "₹15,000",
                "description": "Premium quality herbs",
                "status": "pending"
            }
        ],
        "target_lang": "hi"
    }
    
    Response:
    {
        "original_transactions": [...],
        "translated_transactions": [
            {
                "id": "TXN001",
                "buyer": "आयुर्वेदिक वेलनेस कॉर्प",
                "amount": "₹15,000",
                "description": "प्रीमियम गुणवत्ता जड़ी बूटी",
                "status": "लंबित"
            }
        ],
        "target_lang": "hi",
        "success": true
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'transactions' not in data or 'target_lang' not in data:
            return jsonify({
                'error': 'Missing required fields: transactions, target_lang',
                'success': False
            }), 400
        
        transactions = data['transactions']
        target_lang = data['target_lang']
        
        # Validate inputs
        if not isinstance(transactions, list):
            return jsonify({
                'error': 'Transactions must be a list',
                'success': False
            }), 400
        
        # Fields to translate in payment data
        fields_to_translate = ['buyer', 'description', 'status', 'notes']
        
        # Translate transaction data
        translated_transactions = translation_service.translate_list_of_objects(
            transactions, 
            fields_to_translate, 
            target_lang
        )
        
        return jsonify({
            'original_transactions': transactions,
            'translated_transactions': translated_transactions,
            'target_lang': target_lang,
            'fields_translated': fields_to_translate,
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Error in translate_payment_data endpoint: {str(e)}")
        return jsonify({
            'error': 'Translation service error',
            'success': False
        }), 500

@translate_api_bp.route('/herb-data', methods=['POST'])
def translate_herb_data():
    """
    Translate herb/batch data specifically
    
    Request body:
    {
        "herbs": [
            {
                "batch_id": "HERB001",
                "species_name": "Tulsi",
                "location": "Pune, Maharashtra",
                "quality_status": "premium",
                "notes": "Organic certified herbs"
            }
        ],
        "target_lang": "hi"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'herbs' not in data or 'target_lang' not in data:
            return jsonify({
                'error': 'Missing required fields: herbs, target_lang',
                'success': False
            }), 400
        
        herbs = data['herbs']
        target_lang = data['target_lang']
        
        # Validate inputs
        if not isinstance(herbs, list):
            return jsonify({
                'error': 'Herbs must be a list',
                'success': False
            }), 400
        
        # Fields to translate in herb data
        fields_to_translate = ['species_name', 'location', 'quality_status', 'notes', 'description']
        
        # Translate herb data
        translated_herbs = translation_service.translate_list_of_objects(
            herbs, 
            fields_to_translate, 
            target_lang
        )
        
        return jsonify({
            'original_herbs': herbs,
            'translated_herbs': translated_herbs,
            'target_lang': target_lang,
            'fields_translated': fields_to_translate,
            'success': True
        })
        
    except Exception as e:
        logger.error(f"Error in translate_herb_data endpoint: {str(e)}")
        return jsonify({
            'error': 'Translation service error',
            'success': False
        }), 500

@translate_api_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get translation cache statistics"""
    try:
        stats = translation_service.get_cache_stats()
        return jsonify({
            'cache_stats': stats,
            'success': True
        })
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        return jsonify({
            'error': 'Failed to get cache stats',
            'success': False
        }), 500

@translate_api_bp.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear translation cache"""
    try:
        translation_service.clear_cache()
        return jsonify({
            'message': 'Translation cache cleared successfully',
            'success': True
        })
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({
            'error': 'Failed to clear cache',
            'success': False
        }), 500

@translate_api_bp.route('/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    return jsonify({
        'supported_languages': translation_service.supported_languages,
        'success': True
    })
