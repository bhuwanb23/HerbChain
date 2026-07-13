"""Schema for farm profile upsert."""
from marshmallow import Schema, fields, validate

from models.farm_profile import IRRIGATION_TYPES, SOIL_TYPES


class FarmProfileSchema(Schema):
    farm_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=120))
    land_size_acres = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0))
    soil_type = fields.String(
        required=False, allow_none=True, validate=validate.OneOf(SOIL_TYPES)
    )
    irrigation_type = fields.String(
        required=False, allow_none=True, validate=validate.OneOf(IRRIGATION_TYPES)
    )
    certifications = fields.List(fields.String(), required=False)
    address = fields.String(required=False, allow_none=True, validate=validate.Length(max=300))
    gps_lat = fields.Float(required=False, allow_none=True)
    gps_lng = fields.Float(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)
