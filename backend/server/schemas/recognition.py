"""Schema for AI re-rank endpoint."""
from marshmallow import Schema, fields, validate


class CandidateSchema(Schema):
    label = fields.String(required=True, validate=validate.Length(min=1, max=200))
    score = fields.Float(required=True, validate=validate.Range(min=0.0, max=1.0))


class RerankSchema(Schema):
    candidates = fields.List(
        fields.Nested(CandidateSchema),
        required=True,
        validate=validate.Length(min=1, max=20),
    )
    gps_lat = fields.Float(required=False, allow_none=True, load_default=None)
    gps_lng = fields.Float(required=False, allow_none=True, load_default=None)
    image_url = fields.String(required=False, allow_none=True, load_default=None)
    top_k = fields.Integer(
        required=False, validate=validate.Range(min=1, max=10), load_default=3
    )
