"""
Admin routes for database management and monitoring
"""
from flask import Blueprint, render_template, jsonify, request
from models import db
from models.farmers import FarmerProfile, HerbBatch
from config.logging import get_logger, log_database_operation
import json
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
logger = get_logger('admin')

@admin_bp.route('/')
def dashboard():
    """Admin dashboard"""
    return render_template('db_admin.html')

@admin_bp.route('/api/stats')
def get_stats():
    """Get database statistics"""
    try:
        stats = {
            'total_farmers': FarmerProfile.query.count(),
            'total_batches': HerbBatch.query.count(),
            'recent_batches': HerbBatch.query.filter(
                HerbBatch.created_at >= datetime.utcnow() - timedelta(days=7)
            ).count()
        }
        
        log_database_operation('SELECT', 'statistics', details='Admin stats requested')
        return jsonify(stats)
    
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({'error': 'Failed to get statistics'}), 500

@admin_bp.route('/api/farmers')
def get_farmers():
    """Get farmers list"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        farmers = FarmerProfile.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        farmers_data = []
        for farmer in farmers.items:
            farmers_data.append({
                'farmer_id': farmer.farmer_id,
                'name': farmer.name,
                'phone_number': farmer.phone_number,
                'farming_type': farmer.farming_type,
                'land_area': farmer.land_area,
                'created_at': farmer.created_at.isoformat() if farmer.created_at else None,
                'total_batches': len(farmer.herb_batches),
                'total_earnings': sum(p.amount for p in farmer.payments if p.is_completed)
            })
        
        log_database_operation('SELECT', 'farmers', details=f'Page {page}')
        return jsonify({
            'farmers': farmers_data,
            'total': farmers.total,
            'pages': farmers.pages,
            'current_page': page
        })
    
    except Exception as e:
        logger.error(f"Error getting farmers: {str(e)}")
        return jsonify({'error': 'Failed to get farmers'}), 500

@admin_bp.route('/api/batches')
def get_batches():
    """Get herb batches list"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        query = HerbBatch.query
        if status:
            query = query.filter_by(status=status)
        
        batches = query.paginate(page=page, per_page=per_page, error_out=False)
        
        batches_data = []
        for batch in batches.items:
            batches_data.append({
                'batch_id': batch.batch_id,
                'farmer_name': batch.farmer.name if batch.farmer else 'Unknown',
                'species_detected': batch.species_detected,
                'species_entered': batch.species_entered,
                'status': batch.status,
                'created_at': batch.created_at.isoformat() if batch.created_at else None,
                'is_active': batch.is_active
            })
        
        log_database_operation('SELECT', 'herb_batches', details=f'Page {page}, Status: {status}')
        return jsonify({
            'batches': batches_data,
            'total': batches.total,
            'pages': batches.pages,
            'current_page': page
        })
    
    except Exception as e:
        logger.error(f"Error getting batches: {str(e)}")
        return jsonify({'error': 'Failed to get batches'}), 500


@admin_bp.route('/api/logs')
def get_logs():
    """Get system logs"""
    try:
        log_file = 'logs/herbchain.log'
        lines = request.args.get('lines', 100, type=int)
        
        try:
            with open(log_file, 'r') as f:
                log_lines = f.readlines()[-lines:]
            
            logs = []
            for line in log_lines:
                if line.strip():
                    logs.append(line.strip())
            
            return jsonify({'logs': logs})
        
        except FileNotFoundError:
            return jsonify({'logs': ['No log file found']})
    
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        return jsonify({'error': 'Failed to get logs'}), 500

@admin_bp.route('/api/backup', methods=['POST'])
def backup_database():
    """Create database backup"""
    try:
        # This is a simplified backup - in production, use proper backup tools
        backup_data = {
            'farmers': [farmer.to_dict() for farmer in FarmerProfile.query.all()],
            'batches': [batch.to_dict() for batch in HerbBatch.query.all()],
            'backup_timestamp': datetime.utcnow().isoformat()
        }
        
        backup_filename = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path = f"backups/{backup_filename}"
        
        # Create backups directory if it doesn't exist
        import os
        os.makedirs('backups', exist_ok=True)
        
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        log_database_operation('BACKUP', 'database', details=f'Backup created: {backup_filename}')
        return jsonify({
            'message': 'Backup created successfully',
            'filename': backup_filename,
            'path': backup_path
        })
    
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return jsonify({'error': 'Failed to create backup'}), 500

@admin_bp.route('/api/reset', methods=['POST'])
def reset_database():
    """Reset database (WARNING: This will delete all data)"""
    try:
        # This is dangerous - in production, add proper authentication
        if not request.json or not request.json.get('confirm'):
            return jsonify({'error': 'Confirmation required'}), 400
        
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        log_database_operation('RESET', 'database', details='Database reset performed')
        return jsonify({'message': 'Database reset successfully'})
    
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return jsonify({'error': 'Failed to reset database'}), 500

@admin_bp.route('/api/health')
def health_check():
    """Database health check"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        
        # Get basic counts
        farmers_count = FarmerProfile.query.count()
        batches_count = HerbBatch.query.count()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'farmers_count': farmers_count,
            'batches_count': batches_count,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500
