"""Schemas for the herb catalogue endpoints."""
from marshmallow import Schema, fields, validate

from models.herb_catalogue import AYUSH_CATEGORIES


class CreateCatalogueEntrySchema(Schema):
    species_id = fields.String(required=False, validate=validate.Length(min=3, max=50))
    common_name = fields.String(required=True, validate=validate.Length(min=1, max=120))
    scientific_name = fields.String(required=True, validate=validate.Length(min=1, max=160))
    ayush_category = fields.String(
        required=False,
        validate=validate.OneOf(AYUSH_CATEGORIES),
        load_default="ayurveda",
    )
    synonyms = fields.List(fields.String(), required=False, load_default=list)
    description = fields.String(required=False, allow_none=True, load_default=None)
    medicinal_uses = fields.String(required=False, allow_none=True, load_default=None)
    image_url = fields.String(required=False, allow_none=True, load_default=None)
    season_planting = fields.String(required=False, allow_none=True, load_default=None)
    season_harvest = fields.String(required=False, allow_none=True, load_default=None)
    default_unit_price_inr = fields.Float(required=False, allow_none=True, load_default=None)


class UpdateCatalogueEntrySchema(Schema):
    common_name = fields.String(required=False, validate=validate.Length(min=1, max=120))
    scientific_name = fields.String(required=False, validate=validate.Length(min=1, max=160))
    ayush_category = fields.String(required=False, validate=validate.OneOf(AYUSH_CATEGORIES))
    synonyms = fields.List(fields.String(), required=False)
    description = fields.String(required=False, allow_none=True)
    medicinal_uses = fields.String(required=False, allow_none=True)
    image_url = fields.String(required=False, allow_none=True)
    season_planting = fields.String(required=False, allow_none=True)
    season_harvest = fields.String(required=False, allow_none=True)
    default_unit_price_inr = fields.Float(required=False, allow_none=True)
    is_active = fields.Boolean(required=False)
