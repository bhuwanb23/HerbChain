"""
Models browsing routes for quick HTML listing per user module
"""
from flask import Blueprint, render_template, jsonify, request
from models import db
from models.farmers import FarmerProfile, HerbBatch, Payment, TrainingContent, TrainingProgress
from models.transporters import TransporterProfile, Trip, BatchTransfer, DeliveryConfirmation, TransporterPayment, TransporterReport
from models.labs import LabProfile, ReceivedBatch, QualityTest, BatchValidation, LabReport, LabPayment

browse_bp = Blueprint('browse', __name__, url_prefix='/browse')

# Mapping of modules to models
MODULE_MODELS = {
    'farmers': [
        ('FarmerProfile', FarmerProfile),
        ('HerbBatch', HerbBatch),
        ('Payment', Payment),
        ('TrainingContent', TrainingContent),
        ('TrainingProgress', TrainingProgress),
    ],
    'transporters': [
        ('TransporterProfile', TransporterProfile),
        ('Trip', Trip),
        ('BatchTransfer', BatchTransfer),
        ('DeliveryConfirmation', DeliveryConfirmation),
        ('TransporterPayment', TransporterPayment),
        ('TransporterReport', TransporterReport),
    ],
    'labs': [
        ('LabProfile', LabProfile),
        ('ReceivedBatch', ReceivedBatch),
        ('QualityTest', QualityTest),
        ('BatchValidation', BatchValidation),
        ('LabReport', LabReport),
        ('LabPayment', LabPayment),
    ]
}

@browse_bp.route('/<module>')
def module_home(module):
    if module not in MODULE_MODELS:
        return render_template('module_not_found.html', module=module), 404
    models = MODULE_MODELS[module]
    return render_template('module_models.html', module=module, models=models)

@browse_bp.route('/<module>/<model_name>')
def module_model_rows(module, model_name):
    if module not in MODULE_MODELS:
        return render_template('module_not_found.html', module=module), 404
    model_pairs = {name: model for name, model in MODULE_MODELS[module]}
    model = model_pairs.get(model_name)
    if not model:
        return render_template('model_not_found.html', module=module, model_name=model_name), 404

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    pagination = model.query.paginate(page=page, per_page=per_page, error_out=False)
    rows = [getattr(row, 'to_dict', lambda: {})() for row in pagination.items]

    return render_template(
        'module_model_rows.html',
        module=module,
        model_name=model_name,
        rows=rows,
        page=page,
        pages=pagination.pages,
        total=pagination.total,
    )
