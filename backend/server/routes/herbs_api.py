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
from models.transport_records import TransportRecord
from models.lab_reports import LabReport
import ast
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


def parse_qr_payload(text):
    """Parse QR payload created via str(dict). Returns dict or None."""
    try:
        # The QR payload was created with str(qr_data), so parse safely
        payload = ast.literal_eval(text) if isinstance(text, str) else text
        if isinstance(payload, dict):
            return payload
        return None
    except Exception as e:
        logger.warning(f"Failed to parse QR payload: {e}")
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
            if not herb:
                continue
            # Only show herbs that are not yet received by lab
            if herb.quality_status in ('pending_pickup', 'in_transit') and herb.current_owner != lab_id:
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


@herbs_api_bp.route('/pending_pickup', methods=['GET'])
def get_pending_pickup():
    """List herbs that are awaiting transporter pickup (quality_status = pending_pickup or manufacturer_ordered_pending_pickup)."""
    try:
        herbs = Herb.query.filter(Herb.quality_status.in_(['pending_pickup', 'manufacturer_ordered_pending_pickup'])).order_by(Herb.updated_at.desc()).all()
        response = []
        for herb in herbs:
            herb_dict = herb.to_dict()
            herb_dict['farmer'] = User.query.filter_by(user_id=herb.farmer_id).first().to_dict()
            response.append(herb_dict)
        return jsonify({
            'herbs': response,
            'total': len(response)
        })
    except Exception as e:
        logger.error(f"Error listing pending pickup herbs: {str(e)}")
        return jsonify({'error': 'Failed to get pending pickup herbs'}), 500


@herbs_api_bp.route('/<batch_id>/pickup', methods=['POST'])
def pickup_herb(batch_id):
    """Transporter scans Farmer QR to pick up the herb.
    Validates active QR vs payload, deactivates old QR, transfers ownership to transporter,
    generates new QR #2, sets quality_status to in_transit, and creates TransportRecord.
    Body: { transporter_id, scanned_qr_text, pickup_location, dropoff_location }
    """
    try:
        data = request.get_json() or {}
        transporter_id = data.get('transporter_id')
        scanned_qr_text = data.get('scanned_qr_text')
        pickup_location = data.get('pickup_location')
        dropoff_location = data.get('dropoff_location') or 'Lab - TBD'

        if not transporter_id:
            return jsonify({'error': 'transporter_id is required'}), 400

        # Validate transporter exists
        transporter = User.query.filter_by(user_id=transporter_id, role='transporter').first()
        if not transporter:
            return jsonify({'error': 'Transporter not found'}), 404

        # Load herb
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404

        # Must be awaiting pickup
        if herb.quality_status not in ['pending_pickup', 'manufacturer_ordered_pending_pickup']:
            return jsonify({'error': f'Herb is not awaiting pickup. Current status: {herb.quality_status}'}), 400

        # Validate active QR exists
        if not herb.active_qr:
            return jsonify({'error': 'No active QR to validate'}), 400

        # Basic check: scanned_qr_text must include batch_id
        if scanned_qr_text and batch_id not in scanned_qr_text:
            return jsonify({'error': 'QR does not match this batch'}), 400

        # Deactivate current active transfer QR if present
        active_transfer = OwnershipTransfer.get_active_transfer(batch_id)
        if active_transfer:
            active_transfer.deactivate_qr()

        # Generate new QR #2 for transporter custody
        qr_payload = {
            'batch_id': herb.batch_id,
            'previous_owner': herb.current_owner,
            'new_owner': transporter_id,
            'timestamp': datetime.utcnow().isoformat(),
            'type': 'pickup_transfer'
        }
        new_qr_code = generate_qr_code(str(qr_payload))
        if not new_qr_code:
            db.session.rollback()
            return jsonify({'error': 'Failed to generate new QR'}), 500

        # Transfer ownership and set status to in_transit
        herb.transfer_ownership(transporter_id, new_qr_code)
        herb.quality_status = 'in_transit'
        herb.updated_at = datetime.utcnow()

        # Log ownership transfer
        transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
        ownership_transfer = OwnershipTransfer.create_transfer(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=qr_payload['previous_owner'],
            to_owner=transporter_id,
            qr_code=new_qr_code,
            transfer_reason='Pickup',
            location=pickup_location or herb.location,
            notes='Transporter picked up batch from farmer'
        )
        db.session.add(ownership_transfer)

        # Create transport record
        transport_id = f"TRANSPORT-{uuid.uuid4().hex[:8].upper()}"
        transport_record = TransportRecord.create_transport(
            transport_id=transport_id,
            batch_id=batch_id,
            transporter_id=transporter_id,
            pickup_location=pickup_location or herb.location,
            dropoff_location=dropoff_location,
            start_time=datetime.utcnow(),
            status='in_transit'
        )
        db.session.add(transport_record)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Pickup successful. Ownership transferred to transporter.',
            'herb': herb.to_dict(),
            'new_qr_code': new_qr_code,
            'ownership_transfer': ownership_transfer.to_dict(),
            'transport_record': transport_record.to_dict()
        }), 200
    except ValueError as e:
        db.session.rollback()
        logger.warning(f"Validation error during pickup {batch_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during pickup for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to complete pickup'}), 500


@herbs_api_bp.route('/transporter/<transporter_id>/active', methods=['GET'])
def get_transporter_active(transerporter_id=None, transporter_id=None):
    """List herbs currently in transit for a transporter (current_owner = transporter_id)."""
    try:
        tid = transporter_id or transerporter_id
        if not tid:
            return jsonify({'error': 'Transporter ID is required'}), 400
        # Validate transporter exists
        transporter = User.query.filter_by(user_id=tid, role='transporter').first()
        if not transporter:
            return jsonify({'error': 'Transporter not found'}), 404

        herbs = Herb.query.filter_by(current_owner=tid, quality_status='in_transit').order_by(Herb.updated_at.desc()).all()
        response = []
        for herb in herbs:
            herb_dict = herb.to_dict()
            herb_dict['farmer'] = User.query.filter_by(user_id=herb.farmer_id).first().to_dict()
            response.append(herb_dict)
        return jsonify({
            'herbs': response,
            'total': len(response)
        })
    except Exception as e:
        logger.error(f"Error listing active herbs for transporter {transporter_id}: {str(e)}")
        return jsonify({'error': 'Failed to get active trips'}), 500


@herbs_api_bp.route('/transporter/<transporter_id>/completed', methods=['GET'])
def get_transporter_completed(transporter_id):
    """List herbs delivered by a transporter (transport record delivered)."""
    try:
        # Validate transporter exists
        transporter = User.query.filter_by(user_id=transporter_id, role='transporter').first()
        if not transporter:
            return jsonify({'error': 'Transporter not found'}), 404

        # Find delivered transport records
        delivered = TransportRecord.query.filter_by(transporter_id=transporter_id, status='delivered').order_by(TransportRecord.end_time.desc()).all()
        batch_ids = [rec.batch_id for rec in delivered]
        if not batch_ids:
            return jsonify({'herbs': [], 'total': 0})

        herbs = Herb.query.filter(Herb.batch_id.in_(batch_ids)).all()
        response = []
        for herb in herbs:
            herb_dict = herb.to_dict()
            # Mark this as completed from transporter perspective
            herb_dict['transit_status'] = 'completed'
            response.append(herb_dict)

        return jsonify({'herbs': response, 'total': len(response)})
    except Exception as e:
        logger.error(f"Error listing completed herbs for transporter {transporter_id}: {str(e)}")
        return jsonify({'error': 'Failed to get completed trips'}), 500
@herbs_api_bp.route('/<batch_id>/deliver', methods=['POST'])
def deliver_to_lab(batch_id):
    """Transporter delivers herb to lab by scanning Transporter QR (#2).
    Validates current owner is transporter, deactivates QR, transfers to lab,
    generates Lab QR (#3), sets quality_status to testing, ends transport.
    Body: { lab_id, transporter_id, scanned_qr_text, delivery_location }
    """
    try:
        data = request.get_json() or {}
        lab_id = data.get('lab_id')
        transporter_id = data.get('transporter_id')  # Optional; will fall back to current_owner
        scanned_qr_text = data.get('scanned_qr_text')
        delivery_location = data.get('delivery_location')

        if not lab_id:
            return jsonify({'error': 'lab_id is required'}), 400

        # Validate lab and transporter
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404
        # Load herb
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404

        # If transporter_id not provided, infer from current owner
        effective_transporter_id = transporter_id or herb.current_owner
        transporter = User.query.filter_by(user_id=effective_transporter_id, role='transporter').first()
        if not transporter:
            return jsonify({'error': 'Current owner is not a transporter or transporter not found'}), 400

        # Validate current owner and status
        if herb.current_owner != effective_transporter_id:
            return jsonify({'error': 'Herb is not currently owned by the transporter'}), 400
        if herb.quality_status != 'in_transit':
            return jsonify({'error': f'Herb is not in transit (status={herb.quality_status})'}), 400

        # Validate QR payload basics
        if scanned_qr_text and batch_id not in scanned_qr_text:
            return jsonify({'error': 'QR does not match this batch'}), 400

        # Deactivate current QR
        active_transfer = OwnershipTransfer.get_active_transfer(batch_id)
        if active_transfer:
            active_transfer.deactivate_qr()

        # Generate new Lab QR (#3)
        qr_payload = {
            'batch_id': herb.batch_id,
            'previous_owner': herb.current_owner,
            'new_owner': lab_id,
            'timestamp': datetime.utcnow().isoformat(),
            'type': 'lab_receipt'
        }
        new_lab_qr = generate_qr_code(str(qr_payload))
        if not new_lab_qr:
            db.session.rollback()
            return jsonify({'error': 'Failed to generate Lab QR'}), 500

        # Transfer to lab and set status to testing
        herb.transfer_ownership(lab_id, new_lab_qr)
        herb.quality_status = 'testing'
        herb.updated_at = datetime.utcnow()

        # Log ownership transfer
        transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
        ownership_transfer = OwnershipTransfer.create_transfer(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=qr_payload['previous_owner'],
            to_owner=lab_id,
            qr_code=new_lab_qr,
            transfer_reason='Delivery to Lab',
            location=delivery_location or herb.location,
            notes='Transporter delivered batch to lab'
        )
        db.session.add(ownership_transfer)

        # End transport record
        transport_record = TransportRecord.query.filter_by(batch_id=batch_id, transporter_id=effective_transporter_id, status='in_transit').order_by(TransportRecord.start_time.desc()).first()
        if transport_record:
            transport_record.status = 'delivered'
            transport_record.end_time = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Delivery successful. Ownership transferred to lab.',
            'herb': herb.to_dict(),
            'new_qr_code': new_lab_qr,
            'ownership_transfer': ownership_transfer.to_dict()
        }), 200
    except ValueError as e:
        db.session.rollback()
        logger.warning(f"Validation error during delivery {batch_id}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during delivery for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to complete delivery'}), 500


@herbs_api_bp.route('/lab/<lab_id>/archived', methods=['GET'])
def get_lab_archived(lab_id):
    """List herbs scanned/received by lab (ownership currently lab, status testing or later)."""
    try:
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404

        herbs = Herb.query.filter(Herb.current_owner == lab_id).order_by(Herb.updated_at.desc()).all()
        response = [h.to_dict() for h in herbs]
        return jsonify({'herbs': response, 'total': len(response)})
    except Exception as e:
        logger.error(f"Error listing archived herbs for lab {lab_id}: {str(e)}")
        return jsonify({'error': 'Failed to get archived herbs'}), 500


@herbs_api_bp.route('/lab/<lab_id>/testing', methods=['GET'])
def get_lab_testing_queue(lab_id):
    """Return herbs owned by lab that are in testing state (or later)."""
    try:
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404
        herbs = Herb.query.filter(Herb.current_owner == lab_id).order_by(Herb.updated_at.desc()).all()
        return jsonify({'herbs': [h.to_dict() for h in herbs], 'total': len(herbs)})
    except Exception as e:
        logger.error(f"Error getting lab testing queue for {lab_id}: {str(e)}")
        return jsonify({'error': 'Failed to get testing queue'}), 500


@herbs_api_bp.route('/<batch_id>/lab_report', methods=['POST'])
def create_lab_report(batch_id):
    """Create or update a lab report for a batch by the current lab owner."""
    try:
        data = request.get_json() or {}
        lab_id = data.get('lab_id')
        if not lab_id:
            return jsonify({'error': 'lab_id is required'}), 400
        lab = User.query.filter_by(user_id=lab_id, role='lab').first()
        if not lab:
            return jsonify({'error': 'Lab not found'}), 404
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb not found'}), 404
        if herb.current_owner != lab_id:
            return jsonify({'error': 'Herb is not owned by this lab'}), 400

        report_id = f"REPORT-{uuid.uuid4().hex[:8].upper()}"
        report = LabReport.create_report(
            report_id=report_id,
            batch_id=batch_id,
            lab_id=lab_id,
            test_type=data.get('test_type', 'general'),
            results_summary=data.get('results_summary', ''),
            test_date=datetime.utcnow().date(),
            certification=bool(data.get('certification', False)),
            certification_level=data.get('certification_level'),
            report_url=data.get('report_url'),
            purity_percentage=data.get('purity_percentage'),
            moisture_content=data.get('moisture_content'),
            ash_content=data.get('ash_content'),
            heavy_metals_present=bool(data.get('heavy_metals_present', False)),
            pesticides_detected=bool(data.get('pesticides_detected', False)),
            active_compounds=data.get('active_compounds'),
            potency_rating=data.get('potency_rating'),
            notes=data.get('notes'),
            recommendations=data.get('recommendations')
        )
        db.session.add(report)

        new_status = data.get('quality_status')
        if new_status in ('approved', 'rejected', 'testing'):
            herb.quality_status = new_status
            herb.updated_at = datetime.utcnow()

        # Log certification/rejection to blockchain via OwnershipTransfer
        transfer_reason = f"Lab Testing {new_status.capitalize()}"
        transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
        
        # Deactivate any active QR code for this batch before creating a new ownership transfer for reporting.
        active_transfer = OwnershipTransfer.get_active_transfer(batch_id)
        if active_transfer:
            active_transfer.deactivate_qr()

        ownership_transfer = OwnershipTransfer.create_transfer(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=lab_id,
            to_owner=lab_id, # Lab is still the owner, just documenting the event
            qr_code=herb.active_qr, # Reuse the existing active QR for this logging event
            transfer_reason=transfer_reason,
            location=lab.location, # Assuming lab has a location field
            notes=f"Herb batch {batch_id} marked as {new_status} by lab {lab_id}. Report: {report_id}"
        )
        db.session.add(ownership_transfer)

        db.session.commit()
        return jsonify({'success': True, 'report': report.to_dict(), 'herb': herb.to_dict()})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating lab report for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to save lab report'}), 500


@herbs_api_bp.route('/<batch_id>/lab_report', methods=['GET'])
def list_lab_reports(batch_id):
    try:
        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb not found'}), 404
        reports = LabReport.query.filter_by(batch_id=batch_id).order_by(LabReport.created_at.desc()).all()
        return jsonify({'reports': [r.to_dict() for r in reports], 'total': len(reports)})
    except Exception as e:
        logger.error(f"Error listing lab reports for {batch_id}: {str(e)}")
        return jsonify({'error': 'Failed to list lab reports'}), 500


@herbs_api_bp.route('/approved_for_manufacturer', methods=['GET'])
def get_approved_herbs_for_manufacturer():
    """List herbs with quality_status 'approved' or 'rejected', along with their latest lab report, for manufacturers."""
    try:
        herbs = Herb.query.filter(Herb.quality_status.in_(['approved', 'rejected'])).order_by(Herb.updated_at.desc()).all()
        response = []
        for herb in herbs:
            herb_dict = herb.to_dict()
            # Fetch the latest lab report for each approved herb
            latest_report = LabReport.query.filter_by(batch_id=herb.batch_id).order_by(LabReport.created_at.desc()).first()
            herb_dict['latest_lab_report'] = latest_report.to_dict() if latest_report else None
            response.append(herb_dict)
        
        return jsonify({'herbs': response, 'total': len(response)})
    except Exception as e:
        logger.error(f"Error getting approved herbs for manufacturer: {str(e)}")
        return jsonify({'error': 'Failed to get approved herbs'}), 500

@herbs_api_bp.route('/<batch_id>/order_by_manufacturer', methods=['POST'])
def order_herb_by_manufacturer(batch_id):
    """Manufacturer orders an approved herb, marking it as pending for transporter pickup."""
    try:
        data = request.get_json()
        manufacturer_id = data.get('manufacturer_id')

        if not manufacturer_id:
            return jsonify({'error': 'Manufacturer ID is required'}), 400

        manufacturer = User.query.filter_by(user_id=manufacturer_id, role='manufacturer').first()
        if not manufacturer:
            return jsonify({'error': 'Manufacturer not found'}), 404

        herb = Herb.query.filter_by(batch_id=batch_id).first()
        if not herb:
            return jsonify({'error': 'Herb batch not found'}), 404

        if herb.quality_status != 'approved':
            return jsonify({'error': f'Herb is not approved for ordering. Current status: {herb.quality_status}'}), 400

        if herb.current_owner == manufacturer_id:
            return jsonify({'error': 'Manufacturer already owns this herb'}), 400
        
        # Check if the herb is already pending pickup for a lab or manufacturer
        if herb.quality_status in ['pending_pickup', 'in_transit', 'manufacturer_ordered_pending_pickup']:
            return jsonify({'error': f'Herb is already in a transfer process. Current status: {herb.quality_status}'}), 400

        previous_owner = herb.current_owner
        herb.quality_status = 'manufacturer_ordered_pending_pickup'
        herb.updated_at = datetime.utcnow()

        # Log ownership transfer intent
        transfer_id = f"TRANSFER-{uuid.uuid4().hex[:8].upper()}"
        ownership_transfer = OwnershipTransfer.create_transfer(
            transfer_id=transfer_id,
            batch_id=batch_id,
            from_owner=previous_owner,
            to_owner=manufacturer_id,
            qr_code=herb.active_qr, # Reuse the existing active QR for this logging event
            transfer_reason="Manufacturer Order",
            location=herb.location,
            notes=f"Manufacturer {manufacturer_id} ordered herb batch {batch_id}"
        )
        db.session.add(ownership_transfer)
        db.session.commit()

        logger.info(f"Manufacturer {manufacturer_id} ordered herb batch {batch_id}. Status: {herb.quality_status}")

        return jsonify({
            'success': True,
            'message': 'Herb ordered successfully. Awaiting transporter pickup.',
            'herb': herb.to_dict(),
            'ownership_transfer': ownership_transfer.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error ordering herb {batch_id} by manufacturer {manufacturer_id}: {str(e)}")
        return jsonify({'error': 'Failed to order herb'}), 500
