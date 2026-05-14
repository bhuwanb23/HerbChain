"""Schema for price quote endpoints."""
from marshmallow import Schema, fields, validate


class CreatePriceQuoteSchema(Schema):
    species_id = fields.String(required=True, validate=validate.Length(min=1, max=50))
    price_per_kg_inr = fields.Float(required=True, validate=validate.Range(min=0))
    currency = fields.String(required=False, load_default="INR", validate=validate.Length(min=2, max=8))
    source = fields.String(required=False, load_default="admin", validate=validate.Length(min=1, max=40))
    notes = fields.String(required=False, allow_none=True)
