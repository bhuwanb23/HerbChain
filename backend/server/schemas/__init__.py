"""
Marshmallow schemas for request validation.

Each route picks the schema it wants:
    from schemas.auth import RegisterSchema

Schemas raise `marshmallow.ValidationError` on bad input; routes catch that and
return the consistent JSON error envelope via `utils.responses.error`.
"""
