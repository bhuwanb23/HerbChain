"""
Farmers API routes for herb batch creation and QR generation
"""
from flask import Blueprint, jsonify, request
from models import db
from models.farmers import HerbBatch, FarmerProfile
from utils.qr_utils import generate_qr_base64
from datetime import datetime
from config.logging import get_logger


farmers_api_bp = Blueprint('farmers_api', __name__, url_prefix='/api/v1/farmers')
logger = get_logger('farmers_api')


@farmers_api_bp.post('/batches')
def create_batch():
    """Create a new herb batch and return a generated QR code image.

    Expected JSON body fields (some optional):
    - farmer_id (int, required)
    - species (str)
    - species_detected (str)
    - weight (float)
    - harvestDate (YYYY-MM-DD)
    - cultivationMethod (str)
    - notes (str)
    - image_url (str)
    - geo_location (str)
    - ai_model (str)
    - ai_confidence (float)
    """
    try:
        payload = request.get_json(silent=True) or {}
        logger.info(f"Create batch request payload: {payload}")

        farmer_id = payload.get('farmer_id')
        if not farmer_id:
            logger.warning("Validation error: farmer_id missing")
            return jsonify({'error': 'farmer_id is required'}), 400

        # Validate farmer exists
        farmer = FarmerProfile.query.filter_by(farmer_id=farmer_id).first()
        if not farmer:
            # Dev convenience: auto-create a minimal farmer to unblock testing
            try:
                farmer = FarmerProfile(
                    farmer_id=farmer_id,
                    name=f"Farmer {farmer_id}",
                    phone_number=f"dev-{farmer_id}",
                    password_hash='dev',
                )
                db.session.add(farmer)
                db.session.commit()
                logger.info(f"Auto-created farmer with id={farmer_id} for batch creation")
            except Exception as ce:
                db.session.rollback()
                logger.warning(f"Farmer not found and auto-create failed: {ce}")
                return jsonify({'error': 'Farmer not found', 'farmer_id': farmer_id}), 400

        # Map frontend fields to model
        species_entered = payload.get('species')
        species_detected = payload.get('species_detected')
        weight_kg = None
        if payload.get('weight') not in (None, ''):
            try:
                weight_kg = float(payload['weight'])
            except (TypeError, ValueError):
                logger.warning("Validation error: invalid weight value")
                return jsonify({'error': 'weight must be a number'}), 400

        harvest_date = None
        if payload.get('harvestDate'):
            try:
                harvest_date = datetime.fromisoformat(payload['harvestDate']).date()
            except ValueError:
                logger.warning("Validation error: invalid harvestDate format")
                return jsonify({'error': 'harvestDate must be in ISO format YYYY-MM-DD'}), 400

        batch = HerbBatch(
            farmer_id=farmer_id,
            species_entered=species_entered,
            species_detected=species_detected,
            image_url=payload.get('image_url'),
            geo_location=payload.get('geo_location'),
            weight_kg=weight_kg,
            harvest_date=harvest_date,
            cultivation_method=payload.get('cultivationMethod'),
            remarks=payload.get('notes'),
            ai_model=payload.get('ai_model'),
            ai_confidence=payload.get('ai_confidence'),
            status='Registered',
        )

        # Persist first to get batch_id
        db.session.add(batch)
        db.session.commit()
        logger.info(f"Batch persisted with batch_id={batch.batch_id}")

        # Generate QR payload; include batch_id and essential fields
        qr_payload = {
            'batch_id': batch.batch_id,
            'farmer_id': batch.farmer_id,
            'species': batch.species_entered or batch.species_detected,
            'weight_kg': batch.weight_kg,
            'harvest_date': batch.harvest_date.isoformat() if batch.harvest_date else None,
            'status': batch.status,
            'created_at': batch.created_at.isoformat() if batch.created_at else None,
        }

        qr_data_url = generate_qr_base64(str(qr_payload))

        # Save QR string to batch and update
        batch.qr_code = qr_data_url
        db.session.commit()
        logger.info("QR generated and saved for batch_id=%s", batch.batch_id)

        return jsonify({
            'message': 'Batch created successfully',
            'batch': batch.to_dict(),
            'qr_code': qr_data_url,
        }), 201

    except Exception as e:
        # Rollback on any error
        db.session.rollback()
        logger.exception(f"Unhandled error creating batch: {e}")
        return jsonify({'error': 'Failed to create batch', 'details': str(e)}), 500


