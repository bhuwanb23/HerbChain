"""
Herb Management API - Handle herb batch creation, QR generation, and ownership transfers
"""
import uuid
import qrcode
import io
import base64
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from models import db
from models.herbs import Herb
from models.ownership_transfers import OwnershipTransfer
from models.users import User
from config.logging import get_logger

herbs_api_bp = Blueprint('herbs_api', __name__, url_prefix='/api/v1/herbs')
logger = get_logger('herbs_api')

def generate_qr_code(data):
    """Generate QR code as base64 data URL"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return None

@herbs_api_bp.route('/', methods=['POST'])
def create_herb_batch():
    """Create a new herb batch with QR code generation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['farmer_id', 'species_name', 'harvest_date', 'location', 'weight_kg']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate farmer exists
        farmer = User.query.filter_by(user_id=data['farmer_id'], role='farmer').first()
        if not farmer:
            return jsonify({'error': 'Farmer not found'}), 404
        
        # Generate unique batch ID
        batch_id = f"HERB-{uuid.uuid4().hex[:8].upper()}"
        
        # Parse harvest date
        try:
            if isinstance(data['harvest_date'], str):
                harvest_date = datetime.strptime(data['harvest_date'], '%Y-%m-%d').date()
            else:
                harvest_date = data['harvest_date']
        except ValueError:
            return jsonify({'error': 'Invalid harvest date format. Use YYYY-MM-DD'}), 400
        
        # Validate weight
        try:
            weight_kg = float(data['weight_kg'])
            if weight_kg <= 0:
                return jsonify({'error': 'Weight must be positive'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid weight value'}), 400
        
        # Create herb batch
        herb_data = {
            'batch_id': batch_id,
            'farmer_id': data['farmer_id'],
            'species_name': data['species_name'],
            'harvest_date': harvest_date,
            'location': data['location'],
            'weight_kg': weight_kg,
            'image_url': data.get('image_url'),
            'quality_status': 'pending'
        }
        
        herb = Herb.create_herb(**herb_data)
        db.session.add(herb)
        
        # Generate QR code data
        qr_data = {
            'batch_id': batch_id,
            'farmer_id': data['farmer_id'],
            'species_name': data['species_name'],
            'harvest_date': harvest_date.isoformat(),
            'weight_kg': weight_kg,
            'current_owner': data['farmer_id'],
            'created_at': datetime.utcnow().isoformat(),
            'type': 'herb_creation'
        }
        
        # Generate QR code
        qr_code = generate_qr_code(str(qr_data))
        if not qr_code:
            return jsonify({'error': 'Failed to generate QR code'}), 500
        
        # Update herb with QR code
        herb.active_qr = qr_code
        
        # Create initial ownership transfer record
        transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
        ownership_transfer = OwnershipTransfer.create_transfer(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=None,  # No previous owner for initial creation
            to_owner=data['farmer_id'],
            qr_code=qr_code,
            transfer_reason="Initial Creation",
            location=data['location'],
            notes="Herb batch created by farmer"
        )
        db.session.add(ownership_transfer)
        
        # Commit all changes
        db.session.commit()
        
        logger.info(f"Herb batch created: {batch_id} by farmer {data['farmer_id']}")
        
        return jsonify({
            'success': True,
            'message': 'Herb batch created successfully',
            'herb': herb.to_dict(),
            'qr_code': qr_code,
            'ownership_transfer': ownership_transfer.to_dict()
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        logger.warning(f"Validation error creating herb: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating herb batch: {str(e)}")
        return jsonify({'error': 'Failed to create herb batch'}), 500

@herbs_api_bp.route('/<batch_id>', methods=['GET'])
def get_herb_batch(batch_id):
    """Get herb batch details by batch ID"""
    try:
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404
        
        # Get ownership history
        ownership_history = OwnershipTransfer.get_transfer_history(batch_id)
        
        return jsonify({
            'herb': herb.to_dict(),
            'ownership_history': [transfer.to_dict() for transfer in ownership_history],
            'current_owner': herb.current_owner_user.to_dict() if herb.current_owner_user else None
        })
    except Exception as e:
        logger.error(f"Error getting herb batch {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to get herb batch'}), 500

@herbs_api_bp.route('/farmer/<farmer_id>', methods=['GET'])
def get_farmer_herbs(farmer_id):
    """Get all herbs created by a specific farmer"""
    try:
        # Validate farmer exists
        farmer = User.query.filter_by(user_id=farmer_id, role='farmer').first()
        if not farmer:
            return jsonify({'error': 'Farmer not found'}), 404
        
        herbs = Herb.query.filter_by(farmer_id=farmer_id).order_by(Herb.created_at.desc()).all()
        
        return jsonify({
            'herbs': [herb.to_dict() for herb in herbs],
            'farmer': farmer.to_dict(),
            'total': len(herbs)
        })
    except Exception as e:
        logger.error(f"Error getting farmer herbs for {farmer_id}: {str(e)}")
        return jsonify({'error': 'Failed to get farmer herbs'}), 500

@herbs_api_bp.route('/<batch_id>/ownership', methods=['GET'])
def get_ownership_history(batch_id):
    """Get complete ownership history for a herb batch"""
    try:
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404
        
        ownership_history = OwnershipTransfer.get_transfer_history(batch_id)
        
        return jsonify({
            'batch_id': batch_id,
            'current_owner': herb.current_owner,
            'ownership_history': [transfer.to_dict() for transfer in ownership_history]
        })
    except Exception as e:
        logger.error(f"Error getting ownership history for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to get ownership history'}), 500

@herbs_api_bp.route('/<batch_id>/qr', methods=['GET'])
def get_current_qr(batch_id):
    """Get current active QR code for a herb batch"""
    try:
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404
        
        if not herb.active_qr:
            return jsonify({'error': 'No active QR code found'}), 404
        
        return jsonify({
            'batch_id': batch_id,
            'qr_code': herb.active_qr,
            'current_owner': herb.current_owner
        })
    except Exception as e:
        logger.error(f"Error getting QR code for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to get QR code'}), 500

@herbs_api_bp.route('/available', methods=['GET'])
def get_available_herbs():
    """Get all herbs available for lab testing (status = pending)"""
    try:
        herbs = Herb.query.filter_by(quality_status='pending').order_by(Herb.created_at.desc()).all()
        
        # Get farmer details for each herb
        herbs_with_farmer = []
        for herb in herbs:
            farmer = User.query.filter_by(user_id=herb.farmer_id).first()
            herb_data = herb.to_dict()
            herb_data['farmer'] = farmer.to_dict() if farmer else None
            herbs_with_farmer.append(herb_data)
        
        return jsonify({
            'herbs': herbs_with_farmer,
            'total': len(herbs_with_farmer),
            'status': 'available'
        })
    except Exception as e:
        logger.error(f"Error getting available herbs: {str(e)}")
        return jsonify({'error': 'Failed to get available herbs'}), 500

@herbs_api_bp.route('/<batch_id>/accept', methods=['POST'])
def accept_herb_for_testing(batch_id):
    """Lab accepts herb for testing/research"""
    try:
        data = request.get_json()
        lab_id = data.get('lab_id')
        
        if not lab_id:
            return jsonify({'error': 'Lab ID is required'}), 400
        
        # Validate lab exists
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404
        
        # Get herb batch
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404
        
        # Check if herb is available for testing
        if herb.quality_status != 'pending':
            return jsonify({'error': f'Herb batch is not available for testing. Current status: {herb.quality_status}'}), 400
        
        # Update herb status to pending pickup
        herb.quality_status = 'pending_pickup'
        herb.updated_at = datetime.utcnow()
        
        # Create lab request record (using ownership_transfers table)
        request_id = f"LAB-REQ-{uuid.uuid4().hex[:8].upper()}"
        lab_request = OwnershipTransfer.create_transfer(
            transfer_id=request_id,
            batch_id=batch_id,
            from_owner=herb.current_owner,  # Current farmer
            to_owner=lab_id,  # Lab that will receive
            qr_code=herb.active_qr,  # Keep current QR for now
            transfer_reason="Lab Testing Request",
            location=data.get('lab_location', lab.location),
            notes=f"Lab {lab.name} accepted herb for testing/research"
        )
        db.session.add(lab_request)
        
        # Commit changes
        db.session.commit()
        
        logger.info(f"Lab {lab_id} accepted herb {batch_id} for testing")
        
        return jsonify({
            'success': True,
            'message': 'Herb accepted for testing successfully',
            'herb': herb.to_dict(),
            'lab_request': lab_request.to_dict(),
            'next_step': 'pending_pickup'
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        logger.warning(f"Validation error accepting herb: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error accepting herb {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to accept herb for testing'}), 500

@herbs_api_bp.route('/lab/<lab_id>/accepted', methods=['GET'])
def get_lab_accepted_herbs(lab_id):
    """Get herbs accepted by a specific lab"""
    try:
        # Validate lab exists
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404
        
        # Get herbs accepted by this lab (status = pending_pickup and lab is the intended recipient)
        lab_requests = OwnershipTransfer.query.filter_by(
            to_owner=lab_id,
            transfer_reason='Lab Testing Request'
        ).order_by(OwnershipTransfer.created_at.desc()).all()
        
        # Get herb details for each request
        accepted_herbs = []
        for request in lab_requests:
            herb = Herb.query.filter_by(batch_id=request.batch_id).first()
            if herb:
                herb_data = herb.to_dict()
                herb_data['lab_request'] = request.to_dict()
                herb_data['farmer'] = User.query.filter_by(user_id=herb.farmer_id).first().to_dict()
                accepted_herbs.append(herb_data)
        
        return jsonify({
            'herbs': accepted_herbs,
            'lab': lab.to_dict(),
            'total': len(accepted_herbs)
        })
    except Exception as e:
        logger.error(f"Error getting lab accepted herbs for {lab_id}: {str(e)}")
        return jsonify({'error': 'Failed to get lab accepted herbs'}), 500
