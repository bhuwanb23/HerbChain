"""
Database initialization script for HerbChain
Creates all tables and initial data
"""
import os
import sys
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.users import User
from models.herbs import Herb
from models.ownership_transfers import OwnershipTransfer
from models.transport_records import TransportRecord
from models.lab_reports import LabReport

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Create sample data
        create_sample_data()
        
        print("🎉 Database initialization completed!")

def create_sample_data():
    """Create sample data for testing"""
    print("Creating sample data...")
    
    # Sample Users
    users_data = [
        {
            'user_id': 'farmer_001',
            'role': 'farmer',
            'name': 'Rajesh Kumar',
            'email': 'rajesh@example.com',
            'phone': '+91-9876543210',
            'password_hash': 'hashed_password_1',
            'location': 'Pune, Maharashtra',
            'kyc_verified': True
        },
        {
            'user_id': 'transporter_001',
            'role': 'transporter',
            'name': 'Amit Singh',
            'email': 'amit@example.com',
            'phone': '+91-9876543211',
            'password_hash': 'hashed_password_2',
            'location': 'Mumbai, Maharashtra',
            'kyc_verified': True
        },
        {
            'user_id': 'lab_001',
            'role': 'lab',
            'name': 'Dr. Priya Sharma',
            'email': 'priya@example.com',
            'phone': '+91-9876543212',
            'password_hash': 'hashed_password_3',
            'location': 'Delhi, India',
            'kyc_verified': True
        },
        {
            'user_id': 'admin_001',
            'role': 'admin',
            'name': 'AYUSH Admin',
            'email': 'admin@ayush.gov.in',
            'phone': '+91-9876543213',
            'password_hash': 'hashed_password_4',
            'location': 'New Delhi, India',
            'kyc_verified': True
        }
    ]
    
    for user_data in users_data:
        if not User.query.filter_by(user_id=user_data['user_id']).first():
            user = User.create_user(**user_data)
            db.session.add(user)
    
    # Sample Herb
    herb_data = {
        'batch_id': 'HERB_001_2024',
        'farmer_id': 'farmer_001',
        'species_name': 'Tulsi (Holy Basil)',
        'image_url': 'https://example.com/tulsi.jpg',
        'harvest_date': date(2024, 9, 15),
        'location': 'Pune, Maharashtra',
        'weight_kg': 25.5,
        'quality_status': 'pending',
        'active_qr': 'qr_farmer_001_HERB_001_2024'
    }
    
    if not Herb.query.filter_by(batch_id=herb_data['batch_id']).first():
        herb = Herb.create_herb(**herb_data)
        db.session.add(herb)
        
        # Create initial ownership transfer
        transfer_data = {
            'transfer_id': 'TRANSFER_001',
            'batch_id': herb_data['batch_id'],
            'from_owner': None,  # Initial creation
            'to_owner': 'farmer_001',
            'qr_code': herb_data['active_qr'],
            'transfer_reason': 'Initial Creation',
            'location': herb_data['location']
        }
        
        transfer = OwnershipTransfer.create_transfer(**transfer_data)
        db.session.add(transfer)
    
    # Commit all changes
    db.session.commit()
    print("✅ Sample data created successfully!")

if __name__ == '__main__':
    init_database()