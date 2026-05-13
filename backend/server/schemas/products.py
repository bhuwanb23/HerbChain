"""Schemas for manufacturer product endpoints."""
from marshmallow import Schema, fields, validate


class ProductBatchLinkSchema(Schema):
    batch_id = fields.String(required=True, validate=validate.Length(min=1, max=50))
    quantity_kg = fields.Float(required=True, validate=validate.Range(min=0.01))


class CreateProductSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    sku = fields.String(required=False, allow_none=True, load_default=None)
    description = fields.String(required=False, allow_none=True, load_default=None)
    image_url = fields.String(required=False, allow_none=True, load_default=None)
    source_batches = fields.List(
        fields.Nested(ProductBatchLinkSchema),
        required=True,
        validate=validate.Length(min=1),
    )
