from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

# ==================== USER MODEL ====================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='public')  # admin, owner, tamer, public
    status = db.Column(db.String(20), nullable=False, default='active')  # active, pending, suspended
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    profile_complete = db.Column(db.Boolean, default=False)
    
    # Relationships
    bulls = db.relationship('Bull', backref='owner', lazy='dynamic', foreign_keys='Bull.user_id')
    tamer = db.relationship('Tamer', backref='user', uselist=False, foreign_keys='Tamer.user_id')
    sessions = db.relationship('Session', backref='user', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'status': self.status,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'profile_complete': self.profile_complete
        }

# ==================== SESSION MODEL ====================
class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    expires = db.Column(db.DateTime, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(256))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'login_time': self.login_time.isoformat() if self.login_time else None,
            'expires': self.expires.isoformat() if self.expires else None
        }

# ==================== BULL MODEL ====================
class Bull(db.Model):
    __tablename__ = 'bulls'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    breed = db.Column(db.String(50), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(50))
    weight = db.Column(db.Integer)
    height = db.Column(db.Integer)
    history = db.Column(db.Text)
    special_features = db.Column(db.Text)
    
    # Owner Information
    owner_name = db.Column(db.String(100), nullable=False)
    owner_aadhaar = db.Column(db.String(20))
    owner_phone = db.Column(db.String(20), nullable=False)
    owner_email = db.Column(db.String(120))
    owner_address = db.Column(db.Text)
    
    # Status
    certificate_status = db.Column(db.String(20), default='pending')  # verified, pending, expired
    registration_status = db.Column(db.String(20), default='pending')  # active, pending, rejected, suspended
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Registration fee
    payment_status = db.Column(db.String(20), default='pending')  # paid, pending, refunded
    
    # Relationships
    bookings = db.relationship('Booking', backref='bull', lazy='dynamic')
    certificates = db.relationship('Certificate', backref='bull', lazy='dynamic')
    events = db.relationship('BullEvent', backref='bull', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'name': self.name,
            'breed': self.breed,
            'age': self.age,
            'color': self.color,
            'weight': self.weight,
            'height': self.height,
            'history': self.history,
            'specialFeatures': self.special_features,
            'ownerName': self.owner_name,
            'ownerAadhaar': self.owner_aadhaar,
            'ownerPhone': self.owner_phone,
            'ownerEmail': self.owner_email,
            'ownerAddress': self.owner_address,
            'certificateStatus': self.certificate_status,
            'registrationStatus': self.registration_status,
            'registrationDate': self.registration_date.isoformat() if self.registration_date else None,
            'lastUpdated': self.last_updated.isoformat() if self.last_updated else None,
            'paymentStatus': self.payment_status
        }

# ==================== TAMER MODEL ====================
class Tamer(db.Model):
    __tablename__ = 'tamers'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Personal Information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10))
    height = db.Column(db.Integer)
    weight = db.Column(db.Integer)
    blood_group = db.Column(db.String(10))
    medical_conditions = db.Column(db.Text)
    
    # Location
    address = db.Column(db.Text)
    city = db.Column(db.String(50))
    state = db.Column(db.String(50), default='Tamil Nadu')
    
    # Professional
    experience = db.Column(db.String(50))
    specialization = db.Column(db.String(100))
    previous_events = db.Column(db.Text)
    achievements = db.Column(db.Text)
    training = db.Column(db.Text)
    
    # Emergency Contact
    emergency_name = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(20))
    emergency_relationship = db.Column(db.String(50))
    
    # Status
    certificate_status = db.Column(db.String(20), default='pending')  # valid, expiring, expired, pending
    registration_status = db.Column(db.String(20), default='pending')  # active, pending, rejected, suspended
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Registration fee
    payment_status = db.Column(db.String(20), default='pending')  # paid, pending, refunded
    
    # Relationships
    certificates = db.relationship('Certificate', backref='tamer', lazy='dynamic')
    events = db.relationship('TamerEvent', backref='tamer', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'name': f'{self.first_name} {self.last_name}',
            'email': self.email,
            'phone': self.phone,
            'age': self.age,
            'gender': self.gender,
            'height': self.height,
            'weight': self.weight,
            'blood_group': self.blood_group,
            'medical_conditions': self.medical_conditions,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'experience': self.experience,
            'specialization': self.specialization,
            'previous_events': self.previous_events,
            'achievements': self.achievements,
            'training': self.training,
            'emergency_name': self.emergency_name,
            'emergency_phone': self.emergency_phone,
            'certificate_status': self.certificate_status,
            'registration_status': self.registration_status,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'payment_status': self.payment_status
        }

# ==================== CERTIFICATE MODEL ====================
class Certificate(db.Model):
    __tablename__ = 'certificates'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    bull_id = db.Column(db.String(36), db.ForeignKey('bulls.id'))
    tamer_id = db.Column(db.String(36), db.ForeignKey('tamers.id'))
    
    type = db.Column(db.String(50), nullable=False)  # veterinary, ownership, medical
    file_path = db.Column(db.String(256))
    status = db.Column(db.String(20), default='pending')  # verified, pending, rejected
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    expiry_date = db.Column(db.Date)
    issued_by = db.Column(db.String(100))
    doctor_name = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'bull_id': self.bull_id,
            'tamer_id': self.tamer_id,
            'type': self.type,
            'file_path': self.file_path,
            'status': self.status,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'issued_by': self.issued_by,
            'doctor_name': self.doctor_name,
            'notes': self.notes
        }

# ==================== EVENT MODEL ====================
class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # championship, traditional, festival
    description = db.Column(db.Text)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(10), default='10:00')
    start_time = db.Column(db.String(10), default='08:00')
    end_time = db.Column(db.String(10), default='17:00')
    registration_deadline = db.Column(db.Date, nullable=False)
    
    # Limits
    max_bulls = db.Column(db.Integer, nullable=False, default=50)
    max_tamers = db.Column(db.Integer)
    entry_fee = db.Column(db.Integer, default=0)
    
    # Location
    location = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text)
    district = db.Column(db.String(50))
    state = db.Column(db.String(50), default='Tamil Nadu')
    
    # Requirements
    require_certification = db.Column(db.Boolean, default=True)
    require_medical = db.Column(db.Boolean, default=False)
    
    # Status
    status = db.Column(db.String(20), default='upcoming')  # upcoming, open, closed, completed
    poster_url = db.Column(db.String(256))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Relationships
    slots = db.relationship('EventSlot', backref='event', lazy='dynamic')
    bookings = db.relationship('Booking', backref='event', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
            'max_bulls': self.max_bulls,
            'max_tamers': self.max_tamers,
            'entry_fee': self.entry_fee,
            'location': self.location,
            'address': self.address,
            'district': self.district,
            'state': self.state,
            'require_certification': self.require_certification,
            'require_medical': self.require_medical,
            'status': self.status,
            'poster_url': self.poster_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'slots': [slot.to_dict() for slot in self.slots],
            'bookings_count': self.bookings.count()
        }

# ==================== EVENT SLOT MODEL ====================
class EventSlot(db.Model):
    __tablename__ = 'event_slots'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    slot_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, booked, reserved
    booked_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    booked_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'slot_number': self.slot_number,
            'status': self.status,
            'booked_by': self.booked_by,
            'booked_at': self.booked_at.isoformat() if self.booked_at else None
        }

# ==================== BOOKING MODEL ====================
class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    bull_id = db.Column(db.String(36), db.ForeignKey('bulls.id'))
    tamer_id = db.Column(db.String(36), db.ForeignKey('tamers.id'))
    slot_id = db.Column(db.String(36), db.ForeignKey('event_slots.id'))
    
    # Booking Details
    date = db.Column(db.Date, nullable=False)
    time_slot = db.Column(db.String(10))
    status = db.Column(db.String(20), default='confirmed')  # confirmed, pending, cancelled
    booked_at = db.Column(db.DateTime, default=datetime.utcnow)
    booked_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    
    # Timestamps
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        # Get slot number from the slot relationship
        slot_number = None
        if self.slot_id:
            slot = EventSlot.query.get(self.slot_id)
            if slot:
                slot_number = slot.slot_number
        
        return {
            'id': self.id,
            'event_id': self.event_id,
            'bull_id': self.bull_id,
            'tamer_id': self.tamer_id,
            'slot_id': self.slot_id,
            'slot_number': slot_number,
            'date': self.date.isoformat() if self.date else None,
            'time_slot': self.time_slot,
            'status': self.status,
            'booked_at': self.booked_at.isoformat() if self.booked_at else None,
            'booked_by': self.booked_by,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ==================== BULL EVENT MODEL ====================
class BullEvent(db.Model):
    __tablename__ = 'bull_events'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    bull_id = db.Column(db.String(36), db.ForeignKey('bulls.id'), nullable=False)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    status = db.Column(db.String(20), default='registered')  # registered, participated, completed, cancelled
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'bull_id': self.bull_id,
            'event_id': self.event_id,
            'status': self.status,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None
        }

# ==================== TAMER EVENT MODEL ====================
class TamerEvent(db.Model):
    __tablename__ = 'tamer_events'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tamer_id = db.Column(db.String(36), db.ForeignKey('tamers.id'), nullable=False)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    status = db.Column(db.String(20), default='registered')  # registered, participated, completed, cancelled
    registered_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tamer_id': self.tamer_id,
            'event_id': self.event_id,
            'status': self.status,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None
        }

# ==================== PAYMENT MODEL ====================
class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    
    # Payment Info
    type = db.Column(db.String(50), nullable=False)  # bull_registration, tamer_registration, event_booking
    amount = db.Column(db.Integer, nullable=False)
    method = db.Column(db.String(20), nullable=False)  # online, upi, bank, cash
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    
    # Reference
    reference_id = db.Column(db.String(36))  # ID of the entity being paid for (bull, tamer, event)
    description = db.Column(db.Text)
    
    # Payer Info
    payer_name = db.Column(db.String(100), nullable=False)
    payer_email = db.Column(db.String(120))
    payer_phone = db.Column(db.String(20))
    
    # Payment Method Details
    transaction_id = db.Column(db.String(100))
    card_last4 = db.Column(db.String(4))
    upi_id = db.Column(db.String(50))
    
    # Cash Details
    receipt_no = db.Column(db.String(50))
    collected_by = db.Column(db.String(100))
    collection_location = db.Column(db.String(200))
    
    # Timestamps
    date = db.Column(db.DateTime, default=datetime.utcnow)
    processed_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Refund Info
    refunded = db.Column(db.Boolean, default=False)
    refund_amount = db.Column(db.Integer)
    refund_reason = db.Column(db.Text)
    refund_date = db.Column(db.DateTime)
    
    # Receipt
    receipt_sent = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'amount': self.amount,
            'method': self.method,
            'status': self.status,
            'reference_id': self.reference_id,
            'description': self.description,
            'payer_name': self.payer_name,
            'payer_email': self.payer_email,
            'payer_phone': self.payer_phone,
            'transaction_id': self.transaction_id,
            'card_last4': self.card_last4,
            'upi_id': self.upi_id,
            'receipt_no': self.receipt_no,
            'collected_by': self.collected_by,
            'collection_location': self.collection_location,
            'date': self.date.isoformat() if self.date else None,
            'processed_by': self.processed_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'rejection_reason': self.rejection_reason,
            'refunded': self.refunded,
            'refund_amount': self.refund_amount,
            'refund_reason': self.refund_reason,
            'refund_date': self.refund_date.isoformat() if self.refund_date else None,
            'receipt_sent': self.receipt_sent
        }

# ==================== SPONSOR MODEL ====================
class Sponsor(db.Model):
    __tablename__ = 'sponsors'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    designation = db.Column(db.String(100))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'amount': self.amount,
            'designation': self.designation,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
