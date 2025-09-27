"""
Admin routes for system monitoring (without database dependencies)
"""
from flask import Blueprint, jsonify, request
from config.logging import get_logger
import json
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
logger = get_logger('admin')

@admin_bp.route('/')
def dashboard():
    """Admin dashboard info"""
    return jsonify({
        "name": "HerbChain Admin",
        "status": "ready",
        "message": "Admin panel ready - database reset for new schema",
        "endpoints": {
            "stats": "/admin/api/stats",
            "health": "/admin/api/health",
            "logs": "/admin/api/logs"
        }
    })

@admin_bp.route('/api/stats')
def get_stats():
    """Get system statistics (dummy data for now)"""
    try:
        stats = {
            'total_farmers': 0,
            'total_batches': 0,
            'recent_batches': 0,
            'status': 'Database not initialized - ready for new schema'
        }
        
        logger.info('Admin stats requested (dummy data)')
        return jsonify(stats)
    
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({'error': 'Failed to get statistics'}), 500

@admin_bp.route('/api/farmers')
def get_farmers():
    """Get farmers list (dummy data for now)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Return empty data since database is reset
        farmers_data = []
        
        logger.info(f'Farmers list requested (page {page}) - dummy data')
        return jsonify({
            'farmers': farmers_data,
            'total': 0,
            'pages': 0,
            'current_page': page,
            'message': 'Database reset - no data available'
        })
    
    except Exception as e:
        logger.error(f"Error getting farmers: {str(e)}")
        return jsonify({'error': 'Failed to get farmers'}), 500

@admin_bp.route('/api/batches')
def get_batches():
    """Get herb batches list (dummy data for now)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        
        # Return empty data since database is reset
        batches_data = []
        
        logger.info(f'Batches list requested (page {page}, status: {status}) - dummy data')
        return jsonify({
            'batches': batches_data,
            'total': 0,
            'pages': 0,
            'current_page': page,
            'message': 'Database reset - no data available'
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
            return jsonify({'logs': ['No log file found - system reset']})
    
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        return jsonify({'error': 'Failed to get logs'}), 500

@admin_bp.route('/api/backup', methods=['POST'])
def backup_database():
    """Create database backup (disabled during reset)"""
    try:
        logger.info('Backup requested - disabled during database reset')
        return jsonify({
            'message': 'Backup disabled - database is being reset for new schema',
            'status': 'disabled'
        })
    
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return jsonify({'error': 'Failed to create backup'}), 500

@admin_bp.route('/api/reset', methods=['POST'])
def reset_database():
    """Reset database (already done)"""
    try:
        logger.info('Database reset requested - already completed')
        return jsonify({
            'message': 'Database already reset - ready for new schema',
            'status': 'completed'
        })
    
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return jsonify({'error': 'Failed to reset database'}), 500

@admin_bp.route('/api/health')
def health_check():
    """System health check"""
    try:
        return jsonify({
            'status': 'healthy',
            'database': 'reset - ready for new schema',
            'farmers_count': 0,
            'batches_count': 0,
            'timestamp': datetime.utcnow().isoformat(),
            'message': 'System ready for new database schema'
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500