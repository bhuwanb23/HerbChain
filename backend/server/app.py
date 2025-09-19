import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from config.logging import setup_logging, get_logger
from routes.admin import admin_bp
from routes.users_api import users_api_bp
from models import init_app as init_models

def create_app() -> Flask:
    """Application factory for the Flask app."""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///herbchain.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    CORS(app)
    init_models(app)
    
    # Setup logging
    loggers = setup_logging(app)
    logger = get_logger('main')

    # Register blueprints
    app.register_blueprint(admin_bp)
    app.register_blueprint(users_api_bp)

    @app.get("/")
    def root():
        logger.info("Root (home) page accessed")
        return jsonify({
            "name": "HerbChain Backend",
            "status": "ready",
            "version": "0.1.0",
            "message": "Backend reset - ready for new schema",
            "endpoints": {
                "health": "/health",
                "ping": "/api/v1/ping",
                "admin": "/admin"
            }
        })

    # JSON service info at /api
    @app.get("/api")
    def api_info():
        logger.info("API info endpoint accessed")
        return jsonify({
            "name": "HerbChain Backend",
            "status": "ready",
            "version": "0.1.0",
            "message": "Backend reset - ready for new schema",
            "endpoints": {
                "health": "/health",
                "ping": "/api/v1/ping",
                "admin": "/admin"
            }
        })

    @app.get("/health")
    def health():
        logger.info("Health check requested")
        return jsonify({"status": "healthy"})

    @app.get("/api/v1/ping")
    def ping():
        logger.info("Ping endpoint accessed")
        return jsonify({"message": "pong"})

    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 error: {request.url}")
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"500 error: {str(error)}")
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    # Runs the app for local development
    app.run(host="0.0.0.0", port=5000, debug=True)


