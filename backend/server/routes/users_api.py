"""
User Management API - Handle user operations and authentication
"""
from flask import Blueprint, request, jsonify
from models import db
from models.users import User
from config.logging import get_logger
import uuid
from datetime import datetime

users_api_bp = Blueprint('users_api', __name__, url_prefix='/api/v1/users')
logger = get_logger('users_api')

@users_api_bp.route('/', methods=['GET'])
def list_users():
    """List all users (for development)"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users],
            'total': len(users)
        })
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return jsonify({'error': 'Failed to list users'}), 500

@users_api_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to get user'}), 500

@users_api_bp.route('/role/<role>', methods=['GET'])
def get_users_by_role(role):
    """Get users by role"""
    try:
        users = User.query.filter_by(role=role).all()
        return jsonify({
            'users': [user.to_dict() for user in users],
            'role': role,
            'total': len(users)
        })
    except Exception as e:
        logger.error(f"Error getting users by role {role}: {str(e)}")
        return jsonify({'error': 'Failed to get users by role'}), 500

@users_api_bp.route('/', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Generate user_id if not provided
        user_id = data.get('user_id') or f"{data.get('role', 'user')}_{uuid.uuid4().hex[:8]}"
        
        # Check if user already exists
        if User.query.filter_by(user_id=user_id).first():
            return jsonify({'error': 'User ID already exists'}), 400
        
        if User.query.filter_by(email=data.get('email')).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User.create_user(
            user_id=user_id,
            role=data.get('role'),
            name=data.get('name'),
            email=data.get('email'),
            password_hash=data.get('password_hash', 'default_password'),
            phone=data.get('phone'),
            location=data.get('location'),
            language_pref=data.get('language_pref', 'en'),
            kyc_verified=data.get('kyc_verified', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"Created user: {user_id}")
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating user: {str(e)}")
        return jsonify({'error': 'Failed to create user'}), 500

@users_api_bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update allowed fields
        allowed_fields = ['name', 'phone', 'location', 'language_pref', 'kyc_verified']
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Updated user: {user_id}")
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to update user'}), 500

@users_api_bp.route('/sample/create', methods=['POST'])
def create_sample_accounts():
    """Create sample accounts for development"""
    try:
        sample_users = [
            {
                'user_id': 'farmer_001',
                'role': 'farmer',
                'name': 'Rajesh Kumar',
                'email': 'rajesh@example.com',
                'phone': '+91-9876543210',
                'password_hash': 'dev_farmer_001',
                'location': 'Pune, Maharashtra',
                'kyc_verified': True
            },
            {
                'user_id': 'transporter_001',
                'role': 'transporter',
                'name': 'Amit Singh',
                'email': 'amit@example.com',
                'phone': '+91-9876543211',
                'password_hash': 'dev_transporter_001',
                'location': 'Mumbai, Maharashtra',
                'kyc_verified': True
            },
            {
                'user_id': 'lab_001',
                'role': 'lab',
                'name': 'Dr. Priya Sharma',
                'email': 'priya@example.com',
                'phone': '+91-9876543212',
                'password_hash': 'dev_lab_001',
                'location': 'Delhi, India',
                'kyc_verified': True
            }
        ]
        
        created_users = []
        for user_data in sample_users:
            # Check if user already exists
            existing_user = User.query.filter_by(user_id=user_data['user_id']).first()
            if existing_user:
                logger.info(f"User {user_data['user_id']} already exists, skipping")
                continue
            
            user = User.create_user(**user_data)
            db.session.add(user)
            created_users.append(user_data['user_id'])
        
        db.session.commit()
        
        logger.info(f"Created sample users: {created_users}")
        return jsonify({
            'message': 'Sample accounts created successfully',
            'created_users': created_users,
            'total_created': len(created_users)
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating sample accounts: {str(e)}")
        return jsonify({'error': 'Failed to create sample accounts'}), 500

@users_api_bp.route('/auth/login', methods=['POST'])
def login():
    """Simple login for development (no real authentication)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        password = data.get('password')
        
        if not user_id or not password:
            return jsonify({'error': 'user_id and password required'}), 400
        
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Simple password check for development
        if user.password_hash != password:
            return jsonify({'error': 'Invalid password'}), 401
        
        logger.info(f"User {user_id} logged in successfully")
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({'error': 'Failed to login'}), 500
