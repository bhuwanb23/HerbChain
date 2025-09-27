"""
Database Testing Template
Comprehensive testing utilities for HerbChain database models
"""
import os
import sys
import json
from datetime import datetime, timedelta
from decimal import Decimal

# Ensure app root on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.dirname(CURRENT_DIR)
if APP_ROOT not in sys.path:
    sys.path.insert(0, APP_ROOT)

from app import create_app
from models import db
from models.farmers import (
    FarmerProfile, HerbBatch, Payment, TrainingContent, TrainingProgress
)

class DatabaseTester:
    """Database testing utilities"""
    
    def __init__(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
    def setup_test_db(self):
        """Setup test database"""
        with self.app.app_context():
            db.create_all()
            print("✅ Test database created successfully")
    
    def cleanup_test_db(self):
        """Cleanup test database"""
        with self.app.app_context():
            db.drop_all()
            print("✅ Test database cleaned up")
    
    def test_farmer_creation(self):
        """Test farmer profile creation"""
        print("\n🧪 Testing Farmer Profile Creation...")
        
        with self.app.app_context():
            # Test data
            farmer_data = {
                'name': 'Test Farmer',
                'phone_number': '+91 98765 43210',
                'password_hash': 'hashed_password_123',
                'language_preference': 'en',
                'address': 'Test Village, Test District, Test State',
                'gps_location': '28.6139,77.2090',
                'land_area': 5.5,
                'farming_type': 'organic'
            }
            
            # Create farmer
            farmer = FarmerProfile.from_dict(farmer_data)
            db.session.add(farmer)
            db.session.commit()
            
            # Verify creation
            created_farmer = FarmerProfile.query.filter_by(phone_number=farmer_data['phone_number']).first()
            assert created_farmer is not None, "Farmer not created"
            assert created_farmer.name == farmer_data['name'], "Farmer name mismatch"
            assert created_farmer.farming_type == farmer_data['farming_type'], "Farming type mismatch"
            
            print(f"✅ Farmer created successfully - ID: {created_farmer.farmer_id}")
            return created_farmer
    
    def test_herb_batch_creation(self, farmer_id):
        """Test herb batch creation"""
        print("\n🧪 Testing Herb Batch Creation...")
        
        with self.app.app_context():
            # Test data
            batch_data = {
                'farmer_id': farmer_id,
                'species_detected': 'Tulsi (Ocimum sanctum)',
                'species_entered': 'Tulsi',
                'image_url': 'https://example.com/tulsi.jpg',
                'geo_location': '28.6139,77.2090',
                'harvest_season': 'Winter',
                'status': 'Registered',
                'remarks': 'High quality organic tulsi'
            }
            
            # Create batch
            batch = HerbBatch.from_dict(batch_data)
            db.session.add(batch)
            db.session.commit()
            
            # Verify creation
            created_batch = HerbBatch.query.filter_by(farmer_id=farmer_id).first()
            assert created_batch is not None, "Batch not created"
            assert created_batch.species_entered == batch_data['species_entered'], "Species mismatch"
            assert created_batch.status == batch_data['status'], "Status mismatch"
            
            print(f"✅ Herb batch created successfully - ID: {created_batch.batch_id}")
            return created_batch
    
    def test_payment_creation(self, farmer_id, batch_id):
        """Test payment creation"""
        print("\n🧪 Testing Payment Creation...")
        
        with self.app.app_context():
            # Test data
            payment_data = {
                'farmer_id': farmer_id,
                'batch_id': batch_id,
                'amount': Decimal('2500.00'),
                'payment_type': 'Incentive',
                'status': 'Completed',
                'payment_date': datetime.utcnow(),
                'transaction_reference': 'TXN123456789'
            }
            
            # Create payment
            payment = Payment.from_dict(payment_data)
            db.session.add(payment)
            db.session.commit()
            
            # Verify creation
            created_payment = Payment.query.filter_by(farmer_id=farmer_id).first()
            assert created_payment is not None, "Payment not created"
            assert created_payment.amount == payment_data['amount'], "Amount mismatch"
            assert created_payment.payment_type == payment_data['payment_type'], "Payment type mismatch"
            
            print(f"✅ Payment created successfully - ID: {created_payment.payment_id}")
            return created_payment
    
    def test_training_content_creation(self):
        """Test training content creation"""
        print("\n🧪 Testing Training Content Creation...")
        
        with self.app.app_context():
            # Test data
            training_data = {
                'title': 'Organic Farming Basics',
                'description': 'Learn the fundamentals of organic farming',
                'content_url': 'https://example.com/training/organic-basics.mp4',
                'language': 'en',
                'content_type': 'video',
                'category': 'farming_techniques',
                'difficulty_level': 'beginner',
                'duration_minutes': 30,
                'is_active': True
            }
            
            # Create training content
            training = TrainingContent.from_dict(training_data)
            db.session.add(training)
            db.session.commit()
            
            # Verify creation
            created_training = TrainingContent.query.filter_by(title=training_data['title']).first()
            assert created_training is not None, "Training content not created"
            assert created_training.title == training_data['title'], "Title mismatch"
            assert created_training.difficulty_level == training_data['difficulty_level'], "Difficulty mismatch"
            
            print(f"✅ Training content created successfully - ID: {created_training.training_id}")
            return created_training
    
    def test_training_progress_creation(self, farmer_id, training_id):
        """Test training progress creation"""
        print("\n🧪 Testing Training Progress Creation...")
        
        with self.app.app_context():
            # Test data
            progress_data = {
                'farmer_id': farmer_id,
                'training_id': training_id,
                'status': 'In Progress',
                'completion_percentage': 50.0,
                'last_accessed': datetime.utcnow(),
                'started_at': datetime.utcnow() - timedelta(hours=1)
            }
            
            # Create training progress
            progress = TrainingProgress.from_dict(progress_data)
            db.session.add(progress)
            db.session.commit()
            
            # Verify creation
            created_progress = TrainingProgress.query.filter_by(
                farmer_id=farmer_id, 
                training_id=training_id
            ).first()
            assert created_progress is not None, "Training progress not created"
            assert created_progress.status == progress_data['status'], "Status mismatch"
            assert created_progress.completion_percentage == progress_data['completion_percentage'], "Progress mismatch"
            
            print(f"✅ Training progress created successfully - ID: {created_progress.progress_id}")
            return created_progress
    
    def test_relationships(self):
        """Test model relationships"""
        print("\n🧪 Testing Model Relationships...")
        
        with self.app.app_context():
            # Create test data
            farmer = self.test_farmer_creation()
            batch = self.test_herb_batch_creation(farmer.farmer_id)
            payment = self.test_payment_creation(farmer.farmer_id, batch.batch_id)
            training = self.test_training_content_creation()
            progress = self.test_training_progress_creation(farmer.farmer_id, training.training_id)
            
            # Test farmer relationships
            assert len(farmer.herb_batches) == 1, "Farmer should have 1 herb batch"
            assert len(farmer.payments) == 1, "Farmer should have 1 payment"
            assert len(farmer.training_progress) == 1, "Farmer should have 1 training progress"
            
            # Test batch relationships
            assert batch.farmer.farmer_id == farmer.farmer_id, "Batch should belong to farmer"
            assert len(batch.payments) == 1, "Batch should have 1 payment"
            
            # Test training relationships
            assert len(training.training_progress) == 1, "Training should have 1 progress record"
            
            print("✅ All relationships working correctly")
    
    def test_json_serialization(self):
        """Test JSON serialization"""
        print("\n🧪 Testing JSON Serialization...")
        
        with self.app.app_context():
            # Create test data
            farmer = self.test_farmer_creation()
            batch = self.test_herb_batch_creation(farmer.farmer_id)
            
            # Test to_dict methods
            farmer_dict = farmer.to_dict()
            batch_dict = batch.to_dict()
            
            assert isinstance(farmer_dict, dict), "Farmer to_dict should return dict"
            assert isinstance(batch_dict, dict), "Batch to_dict should return dict"
            assert 'farmer_id' in farmer_dict, "Farmer dict should contain farmer_id"
            assert 'batch_id' in batch_dict, "Batch dict should contain batch_id"
            
            # Test JSON serialization
            farmer_json = json.dumps(farmer_dict, default=str)
            batch_json = json.dumps(batch_dict, default=str)
            
            assert isinstance(farmer_json, str), "Farmer JSON should be string"
            assert isinstance(batch_json, str), "Batch JSON should be string"
            
            print("✅ JSON serialization working correctly")
    
    def test_database_queries(self):
        """Test various database queries"""
        print("\n🧪 Testing Database Queries...")
        
        with self.app.app_context():
            # Create test data
            farmer = self.test_farmer_creation()
            batch = self.test_herb_batch_creation(farmer.farmer_id)
            payment = self.test_payment_creation(farmer.farmer_id, batch.batch_id)
            
            # Test queries
            farmers_count = FarmerProfile.query.count()
            assert farmers_count >= 1, "Should have at least 1 farmer"
            
            organic_farmers = FarmerProfile.query.filter_by(farming_type='organic').count()
            assert organic_farmers >= 1, "Should have at least 1 organic farmer"
            
            active_batches = HerbBatch.query.filter_by(status='Registered').count()
            assert active_batches >= 1, "Should have at least 1 active batch"
            
            completed_payments = Payment.query.filter_by(status='Completed').count()
            assert completed_payments >= 1, "Should have at least 1 completed payment"
            
            print("✅ Database queries working correctly")
    
    def run_all_tests(self):
        """Run all database tests"""
        print("🚀 Starting Database Tests...")
        print("=" * 50)
        
        try:
            self.setup_test_db()
            self.test_relationships()
            self.test_json_serialization()
            self.test_database_queries()
            
            print("\n" + "=" * 50)
            print("🎉 All tests passed successfully!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {str(e)}")
            raise
        finally:
            self.cleanup_test_db()

def run_performance_test():
    """Run performance tests"""
    print("\n⚡ Running Performance Tests...")
    
    tester = DatabaseTester()
    tester.setup_test_db()
    
    with tester.app.app_context():
        import time
        
        # Test bulk insert performance
        start_time = time.time()
        
        farmers = []
        for i in range(100):
            farmer = FarmerProfile(
                name=f'Test Farmer {i}',
                phone_number=f'+91 98765 {i:05d}',
                password_hash=f'hash_{i}',
                farming_type='organic' if i % 2 == 0 else 'conventional'
            )
            farmers.append(farmer)
        
        db.session.add_all(farmers)
        db.session.commit()
        
        end_time = time.time()
        print(f"✅ Inserted 100 farmers in {end_time - start_time:.2f} seconds")
        
        # Test query performance
        start_time = time.time()
        organic_farmers = FarmerProfile.query.filter_by(farming_type='organic').all()
        end_time = time.time()
        print(f"✅ Queried {len(organic_farmers)} organic farmers in {end_time - start_time:.2f} seconds")
    
    tester.cleanup_test_db()

if __name__ == "__main__":
    # Run basic tests
    tester = DatabaseTester()
    tester.run_all_tests()
    
    # Run performance tests
    run_performance_test()
