"""
Lab Reports Model - Stores lab analysis and quality reports
"""
from datetime import datetime
from . import db

class LabReport(db.Model):
    """Lab report for herb quality analysis and certification"""
    __tablename__ = 'lab_reports'
    
    # Primary Key
    report_id = db.Column(db.String(50), primary_key=True)
    
    # Herb and Lab Information
    batch_id = db.Column(db.String(50), db.ForeignKey('herbs.batch_id'), nullable=False)
    lab_id = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    
    # Test Information
    test_type = db.Column(db.String(100), nullable=False)  # e.g., "Quality Check", "Safety Test", "Medicinal Properties"
    results_summary = db.Column(db.Text, nullable=False)
    
    # Certification
    certification = db.Column(db.Boolean, default=False, nullable=False)
    certification_level = db.Column(db.String(50), nullable=True)  # e.g., "Grade A", "Organic", "Premium"
    
    # Report Details
    report_url = db.Column(db.String(500), nullable=True)  # Link to detailed report
    test_date = db.Column(db.Date, nullable=False)
    
    # Quality Metrics
    purity_percentage = db.Column(db.Numeric(5, 2), nullable=True)
    moisture_content = db.Column(db.Numeric(5, 2), nullable=True)
    ash_content = db.Column(db.Numeric(5, 2), nullable=True)
    heavy_metals_present = db.Column(db.Boolean, default=False, nullable=False)
    pesticides_detected = db.Column(db.Boolean, default=False, nullable=False)
    
    # Medicinal Properties
    active_compounds = db.Column(db.Text, nullable=True)  # JSON string of compounds
    potency_rating = db.Column(db.String(20), nullable=True)  # e.g., "High", "Medium", "Low"
    
    # Additional Information
    notes = db.Column(db.Text, nullable=True)
    recommendations = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<LabReport {self.report_id} - {self.batch_id} - {self.test_type}>'
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'report_id': self.report_id,
            'batch_id': self.batch_id,
            'lab_id': self.lab_id,
            'test_type': self.test_type,
            'results_summary': self.results_summary,
            'certification': self.certification,
            'certification_level': self.certification_level,
            'report_url': self.report_url,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'purity_percentage': float(self.purity_percentage) if self.purity_percentage else None,
            'moisture_content': float(self.moisture_content) if self.moisture_content else None,
            'ash_content': float(self.ash_content) if self.ash_content else None,
            'heavy_metals_present': self.heavy_metals_present,
            'pesticides_detected': self.pesticides_detected,
            'active_compounds': self.active_compounds,
            'potency_rating': self.potency_rating,
            'notes': self.notes,
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def create_report(cls, report_id, batch_id, lab_id, test_type, results_summary, test_date, **kwargs):
        """Create a new lab report"""
        if not all([report_id, batch_id, lab_id, test_type, results_summary, test_date]):
            raise ValueError("Missing required fields")
        
        report = cls(
            report_id=report_id,
            batch_id=batch_id,
            lab_id=lab_id,
            test_type=test_type,
            results_summary=results_summary,
            test_date=test_date,
            **kwargs
        )
        return report
    
    def approve_certification(self, certification_level=None):
        """Approve the herb batch for certification"""
        self.certification = True
        if certification_level:
            self.certification_level = certification_level
        self.updated_at = datetime.utcnow()
    
    def reject_certification(self, reason=None):
        """Reject the herb batch certification"""
        self.certification = False
        self.certification_level = None
        if reason:
            self.notes = reason
        self.updated_at = datetime.utcnow()
    
    @classmethod
    def get_reports_by_batch(cls, batch_id):
        """Get all reports for a specific batch"""
        return cls.query.filter_by(batch_id=batch_id).order_by(cls.test_date.desc()).all()
    
    @classmethod
    def get_certified_batches(cls):
        """Get all certified herb batches"""
        return cls.query.filter_by(certification=True).all()
    
    @classmethod
    def get_reports_by_lab(cls, lab_id):
        """Get all reports created by a specific lab"""
        return cls.query.filter_by(lab_id=lab_id).order_by(cls.created_at.desc()).all()
