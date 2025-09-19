"""
Models package for HerbChain Backend
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def init_app(app):
    """Initialize database extensions with Flask app"""
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import only the active models to register with SQLAlchemy
    from .farmers import (
        FarmerProfile,
        HerbBatch,
    )
    from .labs import (
        LabAcceptedBatch,
    )
    
    return db

# Export the db instance for use in other modules
__all__ = ['db', 'migrate', 'init_app']
