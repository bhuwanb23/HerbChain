"""
HerbChain Flask application factory.

Environment variables (see backend/env.example):
    DATABASE_URL        SQLAlchemy URL (defaults to sqlite:///herbchain.db)
    SECRET_KEY          Flask secret key
    JWT_SECRET_KEY      Signing key for JWT auth tokens
    QR_SIGNING_KEY      Signing key for QR ownership tokens
    LOG_LEVEL           Logging level (default INFO)
    CORS_ORIGINS        Comma-separated allowed origins, or "*" for any
"""
import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config.logging import setup_logging, get_logger
from models import init_app as init_models

# Load .env from backend/ if present
load_dotenv()


jwt = JWTManager()


def _normalize_cors_origins(raw: str):
    raw = (raw or "*").strip()
    if raw == "*" or not raw:
        return "*"
    return [o.strip() for o in raw.split(",") if o.strip()]


def create_app(config_overrides: dict | None = None) -> Flask:
    """Application factory."""
    app = Flask(__name__)

    # ---------------------------------------------------------------- config

    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "dev-secret-change-me"
    )
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "sqlite:///herbchain.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # JWT auth config
    app.config["JWT_SECRET_KEY"] = os.environ.get(
        "JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-jwt-change-me")
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

    # QR signing key (read directly by the qr_service; stored in config for visibility)
    app.config["QR_SIGNING_KEY"] = os.environ.get(
        "QR_SIGNING_KEY", os.environ.get("SECRET_KEY", "dev-qr-change-me")
    )

    # Optional file upload config (used by future image upload endpoints)
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )

    if config_overrides:
        app.config.update(config_overrides)

    # ----------------------------------------------------------- extensions

    CORS(
        app,
        resources={r"/*": {"origins": _normalize_cors_origins(os.environ.get("CORS_ORIGINS", "*"))}},
        supports_credentials=False,
    )
    init_models(app)
    jwt.init_app(app)

    setup_logging(app)
    logger = get_logger("main")

    # ------------------------------------------------------------ blueprints

    from routes.admin import admin_bp
    from routes.auth import auth_bp
    from routes.batches import batches_bp
    from routes.crop_plans import crop_plans_bp
    from routes.farm import farm_bp
    from routes.herb_catalogue import catalogue_bp
    from routes.lab_reports import lab_reports_bp
    from routes.prices import prices_bp
    from routes.products import products_bp
    from routes.recognition import recognition_bp
    from routes.traceability import traceability_bp
    from routes.weather import weather_bp

    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(batches_bp)
    app.register_blueprint(crop_plans_bp)
    app.register_blueprint(farm_bp)
    app.register_blueprint(catalogue_bp)
    app.register_blueprint(lab_reports_bp)
    app.register_blueprint(prices_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(recognition_bp)
    app.register_blueprint(traceability_bp)
    app.register_blueprint(weather_bp)

    # ----------------------------------------------------------- core routes

    @app.get("/")
    def root():
        return jsonify(
            {
                "name": "HerbChain Backend",
                "status": "ok",
                "version": "1.0.0",
                "endpoints": {
                    "health": "/health",
                    "ping": "/api/v1/ping",
                    "auth": "/api/v1/auth",
                    "batches": "/api/v1/batches",
                    "lab_reports": "/api/v1/lab-reports",
                    "products": "/api/v1/products",
                    "traceability": "/api/v1/traceability",
                    "admin": "/admin",
                },
            }
        )

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy"})

    @app.get("/api/v1/ping")
    def ping():
        return jsonify({"data": {"message": "pong"}, "error": None})

    # ----------------------------------------------------- JSON error envelope

    def _err(code: str, message: str, http_status: int):
        return (
            jsonify({"data": None, "error": {"code": code, "message": message}}),
            http_status,
        )

    @app.errorhandler(400)
    def _bad_request(e):
        return _err("bad_request", getattr(e, "description", "Bad request"), 400)

    @app.errorhandler(401)
    def _unauthorized(e):
        return _err("unauthorized", getattr(e, "description", "Unauthorized"), 401)

    @app.errorhandler(403)
    def _forbidden(e):
        return _err("forbidden", getattr(e, "description", "Forbidden"), 403)

    @app.errorhandler(404)
    def _not_found(e):
        logger.warning(f"404 {request.method} {request.path}")
        return _err("not_found", "Resource not found", 404)

    @app.errorhandler(405)
    def _method_not_allowed(e):
        return _err("method_not_allowed", "Method not allowed", 405)

    @app.errorhandler(500)
    def _server_error(e):
        logger.exception("500 internal error")
        return _err("internal_error", "Internal server error", 500)

    # JWT error responses follow the same envelope
    @jwt.unauthorized_loader
    def _jwt_missing(reason):
        return _err("unauthorized", f"Missing or invalid token: {reason}", 401)

    @jwt.invalid_token_loader
    def _jwt_invalid(reason):
        return _err("unauthorized", f"Invalid token: {reason}", 401)

    @jwt.expired_token_loader
    def _jwt_expired(jwt_header, jwt_payload):
        return _err("token_expired", "Token has expired", 401)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_DEBUG", "True").lower() == "true",
    )
