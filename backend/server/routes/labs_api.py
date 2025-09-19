"""
Labs API routes for listing batches and accepted batches
"""
from flask import Blueprint, jsonify, request
from models import db
from models.labs import LabAcceptedBatch
from models.farmers import HerbBatch
from config.logging import get_logger


labs_api_bp = Blueprint('labs_api', __name__, url_prefix='/api/v1/labs')
logger = get_logger('labs_api')


def _is_batch_accepted(batch_id: str) -> bool:
    """Check if a batch has been accepted by any lab"""
    return LabAcceptedBatch.query.filter_by(batch_id=batch_id).first() is not None


@labs_api_bp.get('/batches')
def list_batches():
    """List herb registrations for labs to view (uses HerbBatch) with acceptance flag."""
    try:
        logger.info("List lab batches (from HerbBatch)")
        herbs = HerbBatch.query.order_by(HerbBatch.created_at.desc()).all()
        
        enriched = []
        for h in herbs:
            d = h.to_dict()
            d['accepted'] = _is_batch_accepted(h.batch_id)
            enriched.append(d)
        return jsonify({'batches': enriched})
    except Exception as e:
        logger.exception("Failed to list lab batches: %s", e)
        return jsonify({'error': 'Failed to list lab batches', 'details': str(e)}), 500


@labs_api_bp.get('/batches/accepted')
def list_accepted_batches():
    """List accepted batches using LabAcceptedBatch model."""
    try:
        logger.info("List lab accepted batches")
        accepted_batches = LabAcceptedBatch.query.all()
        
        if not accepted_batches:
            return jsonify({'batches': []})
        
        # Get batch IDs from accepted batches
        batch_ids = [ab.batch_id for ab in accepted_batches]
        
        # Get herb batch details
        herbs = HerbBatch.query.filter(HerbBatch.batch_id.in_(batch_ids)).order_by(HerbBatch.created_at.desc()).all()
        
        enriched = []
        for h in herbs:
            d = h.to_dict()
            d['accepted'] = True
            enriched.append(d)
        return jsonify({'batches': enriched})
    except Exception as e:
        logger.exception("Failed to list accepted lab batches: %s", e)
        return jsonify({'error': 'Failed to list accepted lab batches', 'details': str(e)}), 500


@labs_api_bp.post('/batches/accept')
def accept_batch():
    """Mark a herb batch as accepted by the lab.

    Body: { batch_id: string, lab_id?: int, lab_notes?: string }
    Creates LabAcceptedBatch entry.
    """
    try:
        payload = request.get_json(silent=True) or {}
        batch_id = payload.get('batch_id')
        lab_id = payload.get('lab_id') or 1
        lab_notes = payload.get('lab_notes')
        
        if not batch_id:
            return jsonify({'error': 'batch_id is required'}), 400

        # Check if batch exists
        herb_batch = HerbBatch.query.filter_by(batch_id=batch_id).first()
        if not herb_batch:
            return jsonify({'error': 'Herb batch not found'}), 404

        # Check if already accepted by this lab
        existing = LabAcceptedBatch.query.filter_by(batch_id=batch_id, lab_id=lab_id).first()
        if existing:
            return jsonify({'message': 'Batch already accepted by this lab', 'accepted_id': existing.id}), 200

        # Create new acceptance record
        accepted_batch = LabAcceptedBatch(
            batch_id=batch_id,
            lab_id=lab_id,
            lab_notes=lab_notes,
            validation_status='Approved'
        )
        db.session.add(accepted_batch)
        db.session.commit()

        return jsonify({'message': 'Batch accepted', 'accepted_id': accepted_batch.id}), 200
    except Exception as e:
        db.session.rollback()
        logger.exception("Failed to accept batch: %s", e)
        return jsonify({'error': 'Failed to accept batch', 'details': str(e)}), 500


