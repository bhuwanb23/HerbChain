"""
Product + ProductBatchLink — manufacturer finished goods and their source herbs.

When a manufacturer creates a Product, every source Herb batch it consumes is
marked `consumed` (terminal phase) so it can no longer be transferred. The
Product itself gets its own signed QR token that consumers scan to see the
full lineage of its source batches.
"""
from datetime import datetime

from . import db


class Product(db.Model):
    __tablename__ = "products"

    product_id = db.Column(db.String(50), primary_key=True)

    manufacturer_id = db.Column(
        db.String(50),
        db.ForeignKey("users.user_id"),
        nullable=False,
        index=True,
    )

    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), nullable=True, index=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

    # Signed QR token that consumers scan for traceability (read-only).
    qr_token = db.Column(db.Text, nullable=False, default="")

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    batch_links = db.relationship(
        "ProductBatchLink",
        backref="product",
        cascade="all, delete-orphan",
    )
    manufacturer = db.relationship("User", foreign_keys=[manufacturer_id])

    def __repr__(self):
        return f"<Product {self.product_id} name={self.name!r}>"

    def to_dict(self, include_links: bool = False) -> dict:
        out = {
            "product_id": self.product_id,
            "manufacturer_id": self.manufacturer_id,
            "name": self.name,
            "sku": self.sku,
            "description": self.description,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_links:
            out["source_batches"] = [link.to_dict() for link in self.batch_links]
        return out


class ProductBatchLink(db.Model):
    __tablename__ = "product_batch_links"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    product_id = db.Column(
        db.String(50),
        db.ForeignKey("products.product_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_id = db.Column(
        db.String(50),
        db.ForeignKey("herbs.batch_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity_kg = db.Column(db.Numeric(10, 2), nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "batch_id": self.batch_id,
            "quantity_kg": float(self.quantity_kg) if self.quantity_kg is not None else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
