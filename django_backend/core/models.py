from django.db import models
from django.utils import timezone


class Health(models.Model):
    checked_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=32, default='healthy')

    def __str__(self):
        return f"{self.checked_at.isoformat()} - {self.status}"


class User(models.Model):
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('transporter', 'Transporter'),
        ('lab', 'Lab'),
        ('processor', 'Processor'),
        ('consumer', 'Consumer'),
        ('admin', 'Admin'),
        ('manufacturer', 'Manufacturer'),
    ]

    user_id = models.CharField(max_length=64, primary_key=True)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=32, null=True, blank=True)
    password_hash = models.CharField(max_length=255)
    location = models.CharField(max_length=255, null=True, blank=True)
    language_pref = models.CharField(max_length=10, default='en')
    kyc_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'role': self.role,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'location': self.location,
            'language_pref': self.language_pref,
            'kyc_verified': self.kyc_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Herb(models.Model):
    batch_id = models.CharField(max_length=128, primary_key=True)
    farmer = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_herbs')
    species_name = models.CharField(max_length=200)
    image_url = models.URLField(null=True, blank=True)
    harvest_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    quality_status = models.CharField(max_length=64, default='pending')
    active_qr = models.CharField(max_length=255, null=True, blank=True)

    def to_dict(self):
        return {
            'batch_id': self.batch_id,
            'farmer_id': self.farmer.user_id if self.farmer else None,
            'species_name': self.species_name,
            'image_url': self.image_url,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'location': self.location,
            'weight_kg': self.weight_kg,
            'quality_status': self.quality_status,
            'active_qr': self.active_qr,
        }


class OwnershipTransfer(models.Model):
    transfer_id = models.CharField(max_length=128, primary_key=True)
    batch = models.ForeignKey(Herb, on_delete=models.CASCADE, related_name='transfers')
    from_owner = models.CharField(max_length=64, null=True, blank=True)
    to_owner = models.CharField(max_length=64, null=True, blank=True)
    qr_code = models.CharField(max_length=255, null=True, blank=True)
    transfer_reason = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def to_dict(self):
        return {
            'transfer_id': self.transfer_id,
            'batch_id': self.batch.batch_id,
            'from_owner': self.from_owner,
            'to_owner': self.to_owner,
            'qr_code': self.qr_code,
            'transfer_reason': self.transfer_reason,
            'location': self.location,
            'created_at': self.created_at.isoformat(),
        }
