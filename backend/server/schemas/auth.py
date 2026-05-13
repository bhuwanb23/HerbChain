"""Auth request schemas."""
from marshmallow import Schema, fields, validate

from models.users import ROLE_CHOICES


class RegisterSchema(Schema):
    role = fields.String(
        required=True,
        validate=validate.OneOf(ROLE_CHOICES),
    )
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6, max=128))
    phone = fields.String(required=False, allow_none=True, load_default=None)
    location = fields.String(required=False, allow_none=True, load_default=None)
    gps_lat = fields.Float(required=False, allow_none=True, load_default=None)
    gps_lng = fields.Float(required=False, allow_none=True, load_default=None)
    language_pref = fields.String(
        required=False,
        load_default="en",
        validate=validate.Length(min=2, max=10),
    )


class LoginSchema(Schema):
    # Accept email or user_id under the same field.
    identifier = fields.String(required=True, validate=validate.Length(min=1, max=120))
    password = fields.String(required=True, validate=validate.Length(min=1, max=128))
