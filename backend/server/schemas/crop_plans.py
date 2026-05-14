"""Schemas for the crop planning endpoints."""
from marshmallow import Schema, fields, validate

from models.crop_plans import CROP_PLAN_STATUS


class CreateCropPlanSchema(Schema):
    species_id = fields.String(required=True, validate=validate.Length(min=1, max=50))
    area_acres = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0))
    planting_date = fields.Date(required=True)
    expected_harvest_date = fields.Date(required=True)
    status = fields.String(
        required=False,
        validate=validate.OneOf(CROP_PLAN_STATUS),
        load_default="planned",
    )
    notes = fields.String(required=False, allow_none=True)


class UpdateCropPlanSchema(Schema):
    species_id = fields.String(required=False, validate=validate.Length(min=1, max=50))
    area_acres = fields.Float(required=False, allow_none=True, validate=validate.Range(min=0))
    planting_date = fields.Date(required=False)
    expected_harvest_date = fields.Date(required=False)
    actual_harvest_date = fields.Date(required=False, allow_none=True)
    status = fields.String(required=False, validate=validate.OneOf(CROP_PLAN_STATUS))
    notes = fields.String(required=False, allow_none=True)
