"""
HerbChain Database Models

Clean schema:
    - User: identity + role + bcrypt password hash
    - Herb: immutable facts about a harvested batch
    - BatchState: mutable, denormalized current state of a batch (one row per herb)
    - BatchEvent: append-only timeline of everything that happened to a batch
    - LabReport: structured lab results attached to a batch
    - Product / ProductBatchLink: manufacturer finished goods and their source batches
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()


def init_app(app):
    """Initialize database extensions with the Flask app."""
    db.init_app(app)
    migrate.init_app(app, db)

    # Importing the models registers them with SQLAlchemy's metadata so
    # Flask-Migrate can autogenerate migrations.
    from .users import User  # noqa: F401
    from .herbs import Herb  # noqa: F401
    from .batch_state import BatchState  # noqa: F401
    from .batch_events import BatchEvent  # noqa: F401
    from .lab_reports import LabReport  # noqa: F401
    from .products import Product, ProductBatchLink  # noqa: F401

    return db


__all__ = ["db", "migrate", "init_app"]
