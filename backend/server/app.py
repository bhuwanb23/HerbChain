import os
from flask import Flask, jsonify, request, render_template, url_for
from flask_cors import CORS
from models import init_app as init_models
from config.logging import setup_logging, get_logger
from routes.admin import admin_bp
from routes import browse_bp, farmers_api_bp

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
    app.register_blueprint(browse_bp)
    app.register_blueprint(farmers_api_bp)

    @app.get("/")
    def root():
        logger.info("Root (home) page accessed")
        links = {
            "Admin Dashboard": url_for('admin.dashboard'),
            "Health": url_for('health'),
            "Ping": url_for('ping'),
            "API Stats": url_for('admin.get_stats'),
            "API Farmers": url_for('admin.get_farmers'),
            "API Batches": url_for('admin.get_batches'),
            "API Payments": url_for('admin.get_payments'),
            "API Training": url_for('admin.get_training'),
            "API Logs": url_for('admin.get_logs')
        }
        return render_template('home.html', links=links)

    # JSON service info at /api
    @app.get("/api")
    def api_info():
        logger.info("API info endpoint accessed")
        return jsonify({
            "name": "HerbChain Backend",
            "status": "ok",
            "version": "0.1.0",
            "admin_dashboard": "/admin",
            "health": url_for('health'),
            "ping": url_for('ping'),
            "endpoints": {
                "stats": url_for('admin.get_stats'),
                "farmers": url_for('admin.get_farmers'),
                "batches": url_for('admin.get_batches'),
                "payments": url_for('admin.get_payments'),
                "training": url_for('admin.get_training'),
                "logs": url_for('admin.get_logs')
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


