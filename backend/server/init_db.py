"""
Database initialization script
Run this script to create the database tables
"""
from app import create_app
from models import db

def init_database():
    """Initialize the database with all tables"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # You can add sample data here if needed
        print("📊 Database is ready for use!")

if __name__ == "__main__":
    init_database()
