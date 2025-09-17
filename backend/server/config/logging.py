"""
Logging configuration for HerbChain Backend
"""
import os
import logging
import logging.handlers
from datetime import datetime
from pathlib import Path

def setup_logging(app):
    """Setup logging configuration for the Flask app"""
    
    # Create logs directory if it doesn't exist
    logs_dir = Path('logs')
    logs_dir.mkdir(exist_ok=True)
    
    # Set log level based on environment
    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),  # Console output
            logging.FileHandler(logs_dir / 'herbchain.log')  # File output
        ]
    )
    
    # Create specific loggers for different modules
    loggers = {
        'herbchain': logging.getLogger('herbchain'),
        'herbchain.database': logging.getLogger('herbchain.database'),
        'herbchain.api': logging.getLogger('herbchain.api'),
        'herbchain.farmers': logging.getLogger('herbchain.farmers'),
        'herbchain.auth': logging.getLogger('herbchain.auth'),
        'herbchain.payments': logging.getLogger('herbchain.payments'),
        'herbchain.training': logging.getLogger('herbchain.training')
    }
    
    # Configure each logger
    for logger_name, logger in loggers.items():
        logger.setLevel(getattr(logging, log_level))
        
        # Add file handler for each module
        file_handler = logging.FileHandler(
            logs_dir / f'{logger_name.replace("herbchain.", "")}.log'
        )
        file_handler.setLevel(getattr(logging, log_level))
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
    
    # Configure SQLAlchemy logging
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
    
    # Add request logging
    @app.before_request
    def log_request_info():
        logger = logging.getLogger('herbchain.api')
        logger.info(f"Request: {request.method} {request.url}")
    
    @app.after_request
    def log_response_info(response):
        logger = logging.getLogger('herbchain.api')
        logger.info(f"Response: {response.status_code}")
        return response
    
    return loggers

def get_logger(module_name):
    """Get a logger for a specific module"""
    return logging.getLogger(f'herbchain.{module_name}')

def log_database_operation(operation, table, record_id=None, details=None):
    """Log database operations"""
    logger = logging.getLogger('herbchain.database')
    message = f"Database {operation} on {table}"
    if record_id:
        message += f" (ID: {record_id})"
    if details:
        message += f" - {details}"
    logger.info(message)

def log_api_call(endpoint, method, user_id=None, status_code=None):
    """Log API calls"""
    logger = logging.getLogger('herbchain.api')
    message = f"API {method} {endpoint}"
    if user_id:
        message += f" (User: {user_id})"
    if status_code:
        message += f" - Status: {status_code}"
    logger.info(message)

def log_error(error, context=None):
    """Log errors with context"""
    logger = logging.getLogger('herbchain')
    message = f"Error: {str(error)}"
    if context:
        message += f" - Context: {context}"
    logger.error(message, exc_info=True)

def log_security_event(event_type, user_id=None, ip_address=None, details=None):
    """Log security-related events"""
    logger = logging.getLogger('herbchain.security')
    message = f"Security Event: {event_type}"
    if user_id:
        message += f" (User: {user_id})"
    if ip_address:
        message += f" (IP: {ip_address})"
    if details:
        message += f" - {details}"
    logger.warning(message)

def log_business_event(event_type, farmer_id=None, batch_id=None, details=None):
    """Log business-related events"""
    logger = logging.getLogger('herbchain.business')
    message = f"Business Event: {event_type}"
    if farmer_id:
        message += f" (Farmer: {farmer_id})"
    if batch_id:
        message += f" (Batch: {batch_id})"
    if details:
        message += f" - {details}"
    logger.info(message)

# Import request for the decorators
from flask import request
