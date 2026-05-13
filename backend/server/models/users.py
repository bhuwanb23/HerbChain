"""
User model — identity, role, and bcrypt-hashed password.
"""
from datetime import datetime

from passlib.hash import bcrypt

from . import db


ROLE_CHOICES = ("farmer", "transporter", "lab", "manufacturer", "consumer", "admin")


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.String(50), primary_key=True)
    role = db.Column(
        db.Enum(*ROLE_CHOICES, name="user_role"),
        nullable=False,
    )

    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)

    location = db.Column(db.String(200), nullable=True)
    gps_lat = db.Column(db.Float, nullable=True)
    gps_lng = db.Column(db.Float, nullable=True)
    language_pref = db.Column(db.String(10), nullable=False, default="en")

    is_active = db.Column(db.Boolean, nullable=False, default=True)
    kyc_verified = db.Column(db.Boolean, nullable=False, default=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return f"<User {self.user_id} role={self.role}>"

    # ------------------------------------------------------------------ auth

    def set_password(self, plaintext: str) -> None:
        if not plaintext or not isinstance(plaintext, str):
            raise ValueError("Password must be a non-empty string")
        if len(plaintext) < 6:
            raise ValueError("Password must be at least 6 characters")
        self.password_hash = bcrypt.hash(plaintext)

    def check_password(self, plaintext: str) -> bool:
        if not self.password_hash or not plaintext:
            return False
        try:
            return bcrypt.verify(plaintext, self.password_hash)
        except ValueError:
            return False

    # ------------------------------------------------------------ serializer

    def to_dict(self, include_email: bool = True) -> dict:
        data = {
            "user_id": self.user_id,
            "role": self.role,
            "name": self.name,
            "phone": self.phone,
            "location": self.location,
            "gps_lat": self.gps_lat,
            "gps_lng": self.gps_lng,
            "language_pref": self.language_pref,
            "is_active": self.is_active,
            "kyc_verified": self.kyc_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_email:
            data["email"] = self.email
        return data

    # --------------------------------------------------------------- factory

    @classmethod
    def create(
        cls,
        user_id: str,
        role: str,
        name: str,
        email: str,
        password: str,
        **kwargs,
    ) -> "User":
        if role not in ROLE_CHOICES:
            raise ValueError(f"Invalid role '{role}'")
        if not all([user_id, name, email]):
            raise ValueError("user_id, name and email are required")

        user = cls(
            user_id=user_id,
            role=role,
            name=name,
            email=email.lower().strip(),
            phone=kwargs.get("phone"),
            location=kwargs.get("location"),
            gps_lat=kwargs.get("gps_lat"),
            gps_lng=kwargs.get("gps_lng"),
            language_pref=kwargs.get("language_pref", "en"),
            is_active=kwargs.get("is_active", True),
            kyc_verified=kwargs.get("kyc_verified", False),
        )
        user.set_password(password)
        return user
