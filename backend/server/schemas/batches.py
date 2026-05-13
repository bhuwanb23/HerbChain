"""Schemas for batch (Herb) endpoints."""
from marshmallow import Schema, fields, validate


class CreateBatchSchema(Schema):
    species_name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    harvest_date = fields.Date(required=True)
    location = fields.String(required=True, validate=validate.Length(min=1, max=200))
    weight_kg = fields.Float(required=True, validate=validate.Range(min=0.01))
    image_url = fields.String(required=False, allow_none=True, load_default=None)
    gps_lat = fields.Float(required=False, allow_none=True, load_default=None)
    gps_lng = fields.Float(required=False, allow_none=True, load_default=None)
    notes = fields.String(required=False, allow_none=True, load_default=None)


class TransferSchema(Schema):
    scanned_qr_token = fields.String(required=True, validate=validate.Length(min=10))
    location = fields.String(required=False, allow_none=True, load_default=None)
    gps_lat = fields.Float(required=False, allow_none=True, load_default=None)
    gps_lng = fields.Float(required=False, allow_none=True, load_default=None)
    notes = fields.String(required=False, allow_none=True, load_default=None)
