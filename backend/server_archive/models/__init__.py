"""
HerbChain Database Models
Complete ownership transfer system with QR code management
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
    
    # Import all models to register with SQLAlchemy
    from .users import User
    from .herbs import Herb
    from .ownership_transfers import OwnershipTransfer
    from .transport_records import TransportRecord
    from .lab_reports import LabReport
    
    return db

# Export the db instance for use in other modules
__all__ = ['db', 'migrate', 'init_app']
