from flask import Flask, jsonify


def create_app() -> Flask:
    """Application factory for the Flask app."""
    app = Flask(__name__)

    @app.get("/")
    def root():
        return jsonify({
            "name": "HerbChain Backend",
            "status": "ok",
            "version": "0.1.0",
        })

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy"})

    @app.get("/api/v1/ping")
    def ping():
        return jsonify({"message": "pong"})

    return app


app = create_app()


if __name__ == "__main__":
    # Runs the app for local development
    app.run(host="0.0.0.0", port=5000, debug=True)


