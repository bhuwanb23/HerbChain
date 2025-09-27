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

    @classmethod
    def create_herb(cls, batch_id, farmer_id, species_name, harvest_date, location, weight_kg, **kwargs):
        if not all([batch_id, farmer_id, species_name, harvest_date, location, weight_kg]):
            raise ValueError('Missing required fields')
        if float(weight_kg) <= 0:
            raise ValueError('Weight must be positive')
        farmer = User.objects.filter(user_id=farmer_id).first()
        herb = cls(
            batch_id=batch_id,
            farmer=farmer,
            species_name=species_name,
            harvest_date=harvest_date,
            location=location,
            weight_kg=weight_kg,
            current_owner=farmer,
            **kwargs
        )
        return herb

    def transfer_ownership(self, new_owner_id, new_qr_code):
        new_owner = User.objects.filter(user_id=new_owner_id).first()
        if new_owner:
            self.current_owner = new_owner
        else:
            # keep as string fallback by creating a temporary User-like object is not ideal;
            # we will set current_owner to None and rely on to_dict to return IDs
            self.current_owner = None
        self.active_qr = new_qr_code
        self.updated_at = timezone.now()


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
    # Current owner (can be different from farmer). Use FK to User for convenience.
    current_owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='owned_herbs')

    # Timestamps to match Flask model
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

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
            'current_owner': self.current_owner.user_id if self.current_owner else (self.farmer.user_id if self.farmer else None),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class OwnershipTransfer(models.Model):
    transfer_id = models.CharField(max_length=128, primary_key=True)
    batch = models.ForeignKey(Herb, on_delete=models.CASCADE, related_name='transfers')
    from_owner = models.CharField(max_length=64, null=True, blank=True)
    to_owner = models.CharField(max_length=64, null=True, blank=True)
    qr_code = models.CharField(max_length=255, null=True, blank=True)
    transfer_reason = models.CharField(max_length=255, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    # Additional fields to mirror Flask schema
    transfer_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=32, default='active')
    notes = models.TextField(null=True, blank=True)
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
            'transfer_date': self.transfer_date.isoformat() if self.transfer_date else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def create_transfer(cls, transfer_id, batch, from_owner, to_owner, qr_code, **kwargs):
        if not all([transfer_id, batch, to_owner, qr_code]):
            raise ValueError('Missing required fields')
        transfer = cls(
            transfer_id=transfer_id,
            batch=batch,
            from_owner=from_owner,
            to_owner=to_owner,
            qr_code=qr_code,
            **kwargs
        )
        return transfer

    def deactivate_qr(self):
        self.status = 'inactive'
        # note: caller should save()

    @classmethod
    def get_transfer_history(cls, batch):
        return cls.objects.filter(batch=batch).order_by('transfer_date')

    @classmethod
    def get_active_transfer(cls, batch):
        return cls.objects.filter(batch=batch, status='active').order_by('-transfer_date').first()


class TransportRecord(models.Model):
    transport_id = models.CharField(max_length=128, primary_key=True)
    batch = models.ForeignKey(Herb, on_delete=models.CASCADE, related_name='transport_records')
    transporter_id = models.CharField(max_length=64)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    gps_tracking_url = models.URLField(null=True, blank=True)
    status = models.CharField(max_length=64, default='in_transit')
    estimated_duration = models.IntegerField(null=True, blank=True)
    actual_duration = models.IntegerField(null=True, blank=True)
    distance_km = models.FloatField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            'transport_id': self.transport_id,
            'batch_id': self.batch.batch_id,
            'transporter_id': self.transporter_id,
            'pickup_location': self.pickup_location,
            'dropoff_location': self.dropoff_location,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'gps_tracking_url': self.gps_tracking_url,
            'status': self.status,
            'estimated_duration': self.estimated_duration,
            'actual_duration': self.actual_duration,
            'distance_km': self.distance_km,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class LabReport(models.Model):
    report_id = models.CharField(max_length=128, primary_key=True)
    batch = models.ForeignKey(Herb, on_delete=models.CASCADE, related_name='lab_reports')
    lab_id = models.CharField(max_length=64)
    test_type = models.CharField(max_length=100)
    results_summary = models.TextField()
    certification = models.BooleanField(default=False)
    certification_level = models.CharField(max_length=50, null=True, blank=True)
    report_url = models.URLField(null=True, blank=True)
    test_date = models.DateField(null=True, blank=True)
    purity_percentage = models.FloatField(null=True, blank=True)
    moisture_content = models.FloatField(null=True, blank=True)
    ash_content = models.FloatField(null=True, blank=True)
    heavy_metals_present = models.BooleanField(default=False)
    pesticides_detected = models.BooleanField(default=False)
    active_compounds = models.TextField(null=True, blank=True)
    potency_rating = models.CharField(max_length=20, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    recommendations = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            'report_id': self.report_id,
            'batch_id': self.batch.batch_id,
            'lab_id': self.lab_id,
            'test_type': self.test_type,
            'results_summary': self.results_summary,
            'certification': self.certification,
            'certification_level': self.certification_level,
            'report_url': self.report_url,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'purity_percentage': self.purity_percentage,
            'moisture_content': self.moisture_content,
            'ash_content': self.ash_content,
            'heavy_metals_present': self.heavy_metals_present,
            'pesticides_detected': self.pesticides_detected,
            'active_compounds': self.active_compounds,
            'potency_rating': self.potency_rating,
            'notes': self.notes,
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
