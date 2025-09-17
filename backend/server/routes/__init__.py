"""
Routes package for HerbChain Backend
"""
from .admin import admin_bp
from .models_browser import browse_bp

__all__ = ['admin_bp', 'browse_bp']
