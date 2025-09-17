"""
Labs API routes for listing batches and accepted batches
"""
from flask import Blueprint, jsonify, request
from models import db
from models.labs import ReceivedBatch, BatchValidation
from models.farmers import HerbBatch
from config.logging import get_logger


labs_api_bp = Blueprint('labs_api', __name__, url_prefix='/api/v1/labs')
logger = get_logger('labs_api')


def _received_batch_to_dict(row: ReceivedBatch, herb: HerbBatch | None = None) -> dict:
    data = {
        'received_id': getattr(row, 'received_id', None),
        'batch_id': getattr(row, 'batch_id', None),
        'lab_id': getattr(row, 'lab_id', None),
        'transporter_id': getattr(row, 'transporter_id', None),
        'received_time': getattr(row, 'received_time', None).isoformat() if getattr(row, 'received_time', None) else None,
        'condition_status': getattr(row, 'condition_status', None),
        'notes': getattr(row, 'remarks', None),
        'storage_temp_c': getattr(row, 'storage_temp_c', None),
        'integrity_verified': getattr(row, 'integrity_verified', None),
        'created_at': getattr(row, 'created_at', None).isoformat() if getattr(row, 'created_at', None) else None,
    }
    if herb is not None:
        herb_dict = herb.to_dict()
        data['herb'] = herb_dict
        data['farmer_id'] = herb_dict.get('farmer_id')
        data['species'] = herb_dict.get('species_entered') or herb_dict.get('species_detected')
        data['weight_kg'] = herb_dict.get('weight_kg')
        data['harvest_date'] = herb_dict.get('harvest_date')
        data['cultivation_method'] = herb_dict.get('cultivation_method')
        data['status_text'] = herb_dict.get('status')
    return data


@labs_api_bp.get('/batches')
def list_batches():
    """List herb registrations for labs to view (uses HerbBatch)."""
    try:
        logger.info("List lab batches (from HerbBatch)")
        herbs = HerbBatch.query.order_by(HerbBatch.created_at.desc()).all()
        return jsonify({'batches': [h.to_dict() for h in herbs]})
    except Exception as e:
        logger.exception("Failed to list lab batches: %s", e)
        return jsonify({'error': 'Failed to list lab batches', 'details': str(e)}), 500


@labs_api_bp.get('/batches/accepted')
def list_accepted_batches():
    """List accepted batches using validations where validation_status == 'Approved'."""
    try:
        logger.info("List lab accepted batches")
        approved = BatchValidation.query.filter_by(validation_status='Approved').all()
        # BatchValidation.batch_id maps to ReceivedBatch.received_id
        received_ids = [getattr(v, 'batch_id', None) for v in approved if getattr(v, 'batch_id', None)]
        if not received_ids:
            return jsonify({'batches': []})
        # Map validations -> received batches -> herb batch ids, then return HerbBatch rows
        received_rows = ReceivedBatch.query.filter(ReceivedBatch.received_id.in_(received_ids)).all()
        herb_ids = [r.batch_id for r in received_rows if getattr(r, 'batch_id', None)]
        if not herb_ids:
            return jsonify({'batches': []})
        herbs = HerbBatch.query.filter(HerbBatch.batch_id.in_(herb_ids)).order_by(HerbBatch.created_at.desc()).all()
        return jsonify({'batches': [h.to_dict() for h in herbs]})
    except Exception as e:
        logger.exception("Failed to list accepted lab batches: %s", e)
        return jsonify({'error': 'Failed to list accepted lab batches', 'details': str(e)}), 500


