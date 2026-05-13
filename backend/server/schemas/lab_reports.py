"""Schemas for lab report endpoints."""
from marshmallow import Schema, fields, validate


class CreateLabReportSchema(Schema):
    batch_id = fields.String(required=True, validate=validate.Length(min=1, max=50))
    test_type = fields.String(required=True, validate=validate.Length(min=1, max=100))
    test_date = fields.Date(required=True)
    results_summary = fields.String(required=True, validate=validate.Length(min=1))
    outcome = fields.String(required=True, validate=validate.OneOf(["approved", "rejected"]))
    certification_level = fields.String(required=False, allow_none=True, load_default=None)
    purity_percentage = fields.Float(required=False, allow_none=True, load_default=None)
    moisture_content = fields.Float(required=False, allow_none=True, load_default=None)
    ash_content = fields.Float(required=False, allow_none=True, load_default=None)
    heavy_metals_present = fields.Boolean(required=False, allow_none=True, load_default=None)
    pesticides_detected = fields.Boolean(required=False, allow_none=True, load_default=None)
    active_compounds = fields.String(required=False, allow_none=True, load_default=None)
    potency_rating = fields.String(required=False, allow_none=True, load_default=None)
    report_url = fields.String(required=False, allow_none=True, load_default=None)
    notes = fields.String(required=False, allow_none=True, load_default=None)
    recommendations = fields.String(required=False, allow_none=True, load_default=None)
