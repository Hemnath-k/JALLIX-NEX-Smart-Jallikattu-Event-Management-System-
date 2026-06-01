from flask import Flask, request, jsonify, session, send_from_directory
import os
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps

# Get the parent directory (project root)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Import configuration
from config import (
    SECRET_KEY, SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS,
    SQLALCHEMY_ENGINE_OPTIONS, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES,
    UPLOAD_FOLDER, MAX_CONTENT_LENGTH, ALLOWED_EXTENSIONS
)

# Import models
from models import db, User, Session, Bull, Tamer, Event, EventSlot, Booking, Certificate, Payment, BullEvent, TamerEvent, Sponsor

# Import utilities
from utils import hash_password, verify_password, is_valid_email, is_valid_phone, generate_id

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = SQLALCHEMY_ENGINE_OPTIONS
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY

# Enable CORS - Configure based on environment
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080').split(',')
if os.getenv('FLASK_ENV') == 'production':
    # In production, only allow specific origins
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]
else:
    # In development, allow localhost and file:// protocol
    ALLOWED_ORIGINS = ["http://localhost", "http://127.0.0.1", "http://localhost:8080", "file://"]

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})

# Initialize database
db.init_app(app)

# Create upload folder if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database tables on startup
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database initialization error: {e}")

# ==================== AUTHENTICATION DECORATOR ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token format invalid!'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required!'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ==================== AUTH ROUTES ====================
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate email format
        if not is_valid_email(data['email']):
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Validate phone format
        if not is_valid_phone(data['phone']):
            return jsonify({'message': 'Invalid phone number format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 409
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            password_hash=hash_password(data['password']),
            role=data['role'],
            status='active'  # All users are active by default
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.utcnow() + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
        }, JWT_SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if not verify_password(data['password'], user.password_hash):
            return jsonify({'message': 'Invalid password'}), 401
        
        if user.status != 'active':
            return jsonify({'message': 'Account is not active'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Create session
        new_session = Session(
            user_id=user.id,
            expires=datetime.utcnow() + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
        }, JWT_SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    try:
        # In a more complex system, you might blacklist the token
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'message': f'Logout failed: {str(e)}'}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

# ==================== BULL ROUTES ====================
@app.route('/api/bulls', methods=['GET'])
def get_bulls():
    try:
        # Optional token parsing
        current_user = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
                data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
                current_user = User.query.get(data['user_id'])
            except:
                pass

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        my_bulls = request.args.get('my_bulls', 'false').lower() == 'true'
        
        query = Bull.query
        
        # Filter by search term
        if search:
            query = query.filter(
                db.or_(
                    Bull.name.ilike(f'%{search}%'),
                    Bull.breed.ilike(f'%{search}%'),
                    Bull.owner_name.ilike(f'%{search}%')
                )
            )
        
        # Filter by status
        if status:
            query = query.filter(Bull.registration_status == status)
        
        # If user requested only their bulls
        if current_user and my_bulls:
            query = query.filter_by(user_id=current_user.id)
        
        # Paginate results
        pagination = query.order_by(Bull.registration_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        bulls = [bull.to_dict() for bull in pagination.items]
        
        return jsonify({
            'bulls': bulls,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bulls: {str(e)}'}), 500

@app.route('/api/bulls/<id>', methods=['GET'])
@token_required
def get_bull(current_user, id):
    try:
        bull = Bull.query.get(id)
        
        if not bull:
            return jsonify({'message': 'Bull not found'}), 404
        
        # Check permission
        if current_user.role == 'owner' and bull.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        return jsonify({'bull': bull.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bull: {str(e)}'}), 500

@app.route('/api/bulls', methods=['POST'])
@token_required
def create_bull(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'breed', 'age', 'owner_name', 'owner_phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        new_bull = Bull(
            user_id=current_user.id,
            name=data['name'],
            breed=data['breed'],
            age=data['age'],
            color=data.get('color'),
            weight=data.get('weight'),
            height=data.get('height'),
            history=data.get('history'),
            special_features=data.get('special_features'),
            owner_name=data['owner_name'],
            owner_aadhaar=data.get('owner_aadhaar'),
            owner_phone=data['owner_phone'],
            owner_email=data.get('owner_email'),
            owner_address=data.get('owner_address'),
            certificate_status='pending',
            registration_status='pending',
            payment_status='pending'
        )
        
        db.session.add(new_bull)
        db.session.commit()
        
        return jsonify({
            'message': 'Bull registered successfully',
            'bull': new_bull.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to register bull: {str(e)}'}), 500

@app.route('/api/bulls/<id>', methods=['PUT'])
@token_required
def update_bull(current_user, id):
    try:
        bull = Bull.query.get(id)
        
        if not bull:
            return jsonify({'message': 'Bull not found'}), 404
        
        # Check permission
        if current_user.role == 'owner' and bull.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Update fields
        updatable_fields = ['name', 'breed', 'age', 'color', 'weight', 'height',
                          'history', 'special_features', 'owner_name', 'owner_aadhaar',
                          'owner_phone', 'owner_email', 'owner_address']
        
        for field in updatable_fields:
            if field in data:
                setattr(bull, field, data[field])
        
        bull.last_updated = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Bull updated successfully',
            'bull': bull.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update bull: {str(e)}'}), 500

@app.route('/api/bulls/<id>', methods=['DELETE'])
@token_required
def delete_bull(current_user, id):
    try:
        bull = Bull.query.get(id)
        
        if not bull:
            return jsonify({'message': 'Bull not found'}), 404
        
        # Check permission
        if current_user.role == 'owner' and bull.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        if current_user.role not in ['admin', 'owner']:
            return jsonify({'message': 'Access denied'}), 403
        
        db.session.delete(bull)
        db.session.commit()
        
        return jsonify({'message': 'Bull deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete bull: {str(e)}'}), 500

@app.route('/api/bulls/<id>/verify', methods=['POST'])
@token_required
@admin_required
def verify_bull(current_user, id):
    try:
        bull = Bull.query.get(id)
        
        if not bull:
            return jsonify({'message': 'Bull not found'}), 404
        
        data = request.get_json()
        status = data.get('status', 'active')
        
        bull.registration_status = status
        bull.certificate_status = 'verified' if status == 'active' else 'pending'
        bull.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Bull {status} successfully',
            'bull': bull.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Verification failed: {str(e)}'}), 500

# ==================== TAMER ROUTES ====================
@app.route('/api/tamers', methods=['GET'])
@token_required
def get_tamers(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        
        query = Tamer.query
        
        if search:
            query = query.filter(
                db.or_(
                    Tamer.first_name.ilike(f'%{search}%'),
                    Tamer.last_name.ilike(f'%{search}%'),
                    Tamer.email.ilike(f'%{search}%')
                )
            )
        
        if status:
            query = query.filter(Tamer.registration_status == status)
        
        if current_user.role == 'tamer':
            query = query.filter_by(user_id=current_user.id)
        
        pagination = query.order_by(Tamer.registration_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        tamers = [tamer.to_dict() for tamer in pagination.items]
        
        return jsonify({
            'tamers': tamers,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch tamers: {str(e)}'}), 500

@app.route('/api/tamers/<id>', methods=['GET'])
@token_required
def get_tamer(current_user, id):
    try:
        tamer = Tamer.query.get(id)
        
        if not tamer:
            return jsonify({'message': 'Tamer not found'}), 404
        
        if current_user.role == 'tamer' and tamer.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        return jsonify({'tamer': tamer.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch tamer: {str(e)}'}), 500

@app.route('/api/tamers', methods=['POST'])
@token_required
def create_tamer(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['first_name', 'last_name', 'email', 'phone', 'age']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        new_tamer = Tamer(
            user_id=current_user.id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone=data['phone'],
            age=data['age'],
            gender=data.get('gender'),
            height=data.get('height'),
            weight=data.get('weight'),
            blood_group=data.get('blood_group'),
            medical_conditions=data.get('medical_conditions'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state', 'Tamil Nadu'),
            experience=data.get('experience'),
            specialization=data.get('specialization'),
            previous_events=data.get('previous_events'),
            achievements=data.get('achievements'),
            training=data.get('training'),
            emergency_name=data.get('emergency_name'),
            emergency_phone=data.get('emergency_phone'),
            emergency_relationship=data.get('emergency_relationship'),
            certificate_status='pending',
            registration_status='pending',
            payment_status='pending'
        )
        
        db.session.add(new_tamer)
        db.session.commit()
        
        return jsonify({
            'message': 'Tamer registered successfully',
            'tamer': new_tamer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to register tamer: {str(e)}'}), 500

@app.route('/api/tamers/<id>', methods=['PUT'])
@token_required
def update_tamer(current_user, id):
    try:
        tamer = Tamer.query.get(id)
        
        if not tamer:
            return jsonify({'message': 'Tamer not found'}), 404
        
        if current_user.role == 'tamer' and tamer.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        data = request.get_json()
        
        updatable_fields = ['first_name', 'last_name', 'email', 'phone', 'age',
                          'gender', 'height', 'weight', 'blood_group', 'medical_conditions',
                          'address', 'city', 'state', 'experience', 'specialization',
                          'previous_events', 'achievements', 'training',
                          'emergency_name', 'emergency_phone', 'emergency_relationship']
        
        for field in updatable_fields:
            if field in data:
                setattr(tamer, field, data[field])
        
        tamer.last_updated = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Tamer updated successfully',
            'tamer': tamer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update tamer: {str(e)}'}), 500

@app.route('/api/tamers/<id>', methods=['DELETE'])
@token_required
def delete_tamer(current_user, id):
    try:
        tamer = Tamer.query.get(id)
        
        if not tamer:
            return jsonify({'message': 'Tamer not found'}), 404
        
        if current_user.role == 'tamer' and tamer.user_id != current_user.id:
            return jsonify({'message': 'Access denied'}), 403
        
        if current_user.role not in ['admin', 'tamer']:
            return jsonify({'message': 'Access denied'}), 403
        
        db.session.delete(tamer)
        db.session.commit()
        
        return jsonify({'message': 'Tamer deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete tamer: {str(e)}'}), 500

@app.route('/api/tamers/<id>/verify', methods=['POST'])
@token_required
@admin_required
def verify_tamer(current_user, id):
    try:
        tamer = Tamer.query.get(id)
        
        if not tamer:
            return jsonify({'message': 'Tamer not found'}), 404
        
        data = request.get_json()
        status = data.get('status', 'active')
        
        tamer.registration_status = status
        tamer.certificate_status = 'valid' if status == 'active' else 'pending'
        tamer.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Tamer {status} successfully',
            'tamer': tamer.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Verification failed: {str(e)}'}), 500

# ==================== EVENT ROUTES ====================
@app.route('/api/events', methods=['GET'])
def get_events():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        
        query = Event.query
        
        if status:
            query = query.filter(Event.status == status)
        
        pagination = query.order_by(Event.date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        events = [event.to_dict() for event in pagination.items]
        
        return jsonify({
            'events': events,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch events: {str(e)}'}), 500

@app.route('/api/events/<id>', methods=['GET'])
def get_event(id):
    try:
        event = Event.query.get(id)
        
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        
        return jsonify({'event': event.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch event: {str(e)}'}), 500

@app.route('/api/events', methods=['POST'])
@token_required
# @admin_required  # Temporarily disabled to allow all logged-in users to create events
def create_event(current_user):
    try:
        print(f"DEBUG: create_event called by user: {current_user.email}, role: {current_user.role}")
        data = request.get_json()
        print(f"DEBUG: Received data: {data}")
        
        required_fields = ['name', 'type', 'date', 'registration_deadline', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        new_event = Event(
            name=data['name'],
            type=data['type'],
            description=data.get('description'),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=data.get('time', '10:00'),
            start_time=data.get('start_time', '08:00'),
            end_time=data.get('end_time', '17:00'),
            registration_deadline=datetime.strptime(data['registration_deadline'], '%Y-%m-%d').date(),
            max_bulls=data.get('max_bulls', 50),
            max_tamers=data.get('max_tamers'),
            entry_fee=data.get('entry_fee', 0),
            location=data['location'],
            address=data.get('address'),
            district=data.get('district'),
            state=data.get('state', 'Tamil Nadu'),
            require_certification=data.get('require_certification', True),
            require_medical=data.get('require_medical', False),
            status='upcoming',
            created_by=current_user.id
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        # Create event slots
        for i in range(1, new_event.max_bulls + 1):
            slot = EventSlot(event_id=new_event.id, slot_number=i)
            db.session.add(slot)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Event created successfully',
            'event': new_event.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create event: {str(e)}'}), 500

@app.route('/api/events/<id>', methods=['PUT'])
@token_required
@admin_required
def update_event(current_user, id):
    try:
        event = Event.query.get(id)
        
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        
        data = request.get_json()
        
        updatable_fields = ['name', 'type', 'description', 'time', 'start_time', 'end_time', 'max_bulls',
                          'max_tamers', 'entry_fee', 'location', 'address',
                          'district', 'state', 'require_certification', 'require_medical', 'status']
        
        for field in updatable_fields:
            if field in data:
                setattr(event, field, data[field])
        
        if 'date' in data:
            event.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        if 'registration_deadline' in data:
            event.registration_deadline = datetime.strptime(data['registration_deadline'], '%Y-%m-%d').date()
        
        event.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Event updated successfully',
            'event': event.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update event: {str(e)}'}), 500

@app.route('/api/events/<id>', methods=['DELETE'])
@token_required
@admin_required
def delete_event(current_user, id):
    try:
        event = Event.query.get(id)
        
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete event: {str(e)}'}), 500

@app.route('/api/events/<id>/book', methods=['POST'])
@token_required
def book_event(current_user, id):
    try:
        event = Event.query.get(id)
        
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        
        data = request.get_json()
        
        # Check if event is open for booking
        if event.status not in ['upcoming', 'open']:
            return jsonify({'message': 'Event is not open for booking'}), 400
        
        # Check registration deadline
        if datetime.now().date() > event.registration_deadline:
            return jsonify({'message': 'Registration deadline has passed'}), 400
        
        # Find available slot
        available_slot = EventSlot.query.filter_by(
            event_id=id, status='available'
        ).first()
        
        if not available_slot:
            return jsonify({'message': 'No slots available'}), 400
        
        # Create booking
        new_booking = Booking(
            event_id=id,
            bull_id=data.get('bull_id'),
            tamer_id=data.get('tamer_id'),
            slot_id=available_slot.id,
            date=event.date,
            time_slot=data.get('time_slot', '10:00'),
            status='confirmed',
            booked_by=current_user.id
        )
        
        # Update slot status
        available_slot.status = 'booked'
        available_slot.booked_by = current_user.id
        available_slot.booked_at = datetime.utcnow()
        
        db.session.add(new_booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Event booked successfully',
            'booking': new_booking.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Booking failed: {str(e)}'}), 500

# ==================== PAYMENT ROUTES ====================
@app.route('/api/payments', methods=['GET'])
@token_required
def get_payments(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Payment.query
        
        # Filter by user role
        if current_user.role != 'admin':
            query = query.filter_by(payer_email=current_user.email)
        
        pagination = query.order_by(Payment.date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        payments = [payment.to_dict() for payment in pagination.items]
        
        return jsonify({
            'payments': payments,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch payments: {str(e)}'}), 500

@app.route('/api/payments', methods=['POST'])
@token_required
def create_payment(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['type', 'amount', 'method', 'payer_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        new_payment = Payment(
            type=data['type'],
            amount=data['amount'],
            method=data['method'],
            reference_id=data.get('reference_id'),
            description=data.get('description'),
            payer_name=data['payer_name'],
            payer_email=data.get('payer_email', current_user.email),
            payer_phone=data.get('payer_phone'),
            transaction_id=data.get('transaction_id'),
            card_last4=data.get('card_last4'),
            upi_id=data.get('upi_id'),
            receipt_no=data.get('receipt_no'),
            collected_by=data.get('collected_by'),
            collection_location=data.get('collection_location'),
            status='pending',
            processed_by=current_user.id
        )
        
        db.session.add(new_payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment recorded successfully',
            'payment': new_payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Payment failed: {str(e)}'}), 500

@app.route('/api/payments/<id>/approve', methods=['PUT'])
@token_required
@admin_required
def approve_payment(current_user, id):
    try:
        payment = Payment.query.get(id)
        
        if not payment:
            return jsonify({'message': 'Payment not found'}), 404
        
        payment.status = 'completed'
        payment.approved_at = datetime.utcnow()
        payment.processed_by = current_user.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment approved successfully',
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Approval failed: {str(e)}'}), 500

@app.route('/api/payments/<id>/reject', methods=['PUT'])
@token_required
@admin_required
def reject_payment(current_user, id):
    try:
        payment = Payment.query.get(id)
        
        if not payment:
            return jsonify({'message': 'Payment not found'}), 404
        
        data = request.get_json()
        
        payment.status = 'failed'
        payment.rejected_at = datetime.utcnow()
        payment.rejection_reason = data.get('reason', '')
        payment.processed_by = current_user.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment rejected',
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Rejection failed: {str(e)}'}), 500

@app.route('/api/payments/<id>/refund', methods=['POST'])
@token_required
@admin_required
def refund_payment(current_user, id):
    try:
        payment = Payment.query.get(id)
        
        if not payment:
            return jsonify({'message': 'Payment not found'}), 404
        
        data = request.get_json()
        
        payment.refunded = True
        payment.refund_amount = data.get('amount', payment.amount)
        payment.refund_reason = data.get('reason', '')
        payment.refund_date = datetime.utcnow()
        payment.status = 'refunded'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment refunded successfully',
            'payment': payment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Refund failed: {str(e)}'}), 500

# ==================== DASHBOARD STATS ====================
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        stats = {
            'total_bulls': Bull.query.count(),
            'active_bulls': Bull.query.filter_by(registration_status='active').count(),
            'total_tamers': Tamer.query.count(),
            'active_tamers': Tamer.query.filter_by(registration_status='active').count(),
            'total_events': Event.query.count(),
            'upcoming_events': Event.query.filter_by(status='upcoming').count(),
            'total_payments': Payment.query.count(),
            'pending_payments': Payment.query.filter_by(status='pending').count(),
            'recent_registrations': []
        }
        
        # Get recent registrations
        recent_bulls = Bull.query.order_by(Bull.registration_date.desc()).limit(5).all()
        recent_tamers = Tamer.query.order_by(Tamer.registration_date.desc()).limit(5).all()
        
        for bull in recent_bulls:
            stats['recent_registrations'].append({
                'type': 'bull',
                'name': bull.name,
                'date': bull.registration_date.isoformat() if bull.registration_date else None,
                'status': bull.registration_status
            })
        
        for tamer in recent_tamers:
            stats['recent_registrations'].append({
                'type': 'tamer',
                'name': f"{tamer.first_name} {tamer.last_name}",
                'date': tamer.registration_date.isoformat() if tamer.registration_date else None,
                'status': tamer.registration_status
            })
        
        # Sort by date
        stats['recent_registrations'].sort(
            key=lambda x: x['date'] if x['date'] else '',
            reverse=True
        )
        stats['recent_registrations'] = stats['recent_registrations'][:5]
        
        return jsonify({'stats': stats}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch stats: {str(e)}'}), 500

@app.route('/api/bookings/my', methods=['GET'])
@token_required
def get_my_bookings(current_user):
    try:
        bookings = Booking.query.filter_by(booked_by=current_user.id).all()
        
        # Get event details for each booking
        bookings_data = []
        for booking in bookings:
            event = Event.query.get(booking.event_id)
            if event:
                booking_dict = booking.to_dict()
                booking_dict['event'] = event.to_dict()
                bookings_data.append(booking_dict)
        
        return jsonify({
            'bookings': bookings_data,
            'total': len(bookings_data)
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bookings: {str(e)}'}), 500
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'message': 'Internal server error'}), 500

# ==================== DATABASE INITIALIZATION ====================
@app.route('/api/init-db', methods=['POST'])
def init_database():
    try:
        db.create_all()
        return jsonify({'message': 'Database initialized successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Database initialization failed: {str(e)}'}), 500

# ==================== SPONSOR ROUTES ====================
@app.route('/api/sponsors', methods=['GET'])
def get_sponsors():
    try:
        sponsors = Sponsor.query.order_by(Sponsor.amount.desc()).all()
        return jsonify({'sponsors': [sponsor.to_dict() for sponsor in sponsors]}), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch sponsors: {str(e)}'}), 500

@app.route('/api/sponsors', methods=['POST'])
@token_required
@admin_required
def create_sponsor(current_user):
    try:
        data = request.get_json()
        required_fields = ['name', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        new_sponsor = Sponsor(
            name=data['name'],
            amount=data['amount'],
            designation=data.get('designation'),
            description=data.get('description')
        )
        db.session.add(new_sponsor)
        db.session.commit()
        return jsonify({'message': 'Sponsor created successfully', 'sponsor': new_sponsor.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create sponsor: {str(e)}'}), 500

@app.route('/api/sponsors/<id>', methods=['PUT'])
@token_required
@admin_required
def update_sponsor(current_user, id):
    try:
        sponsor = Sponsor.query.get(id)
        if not sponsor:
            return jsonify({'message': 'Sponsor not found'}), 404
            
        data = request.get_json()
        if 'name' in data: sponsor.name = data['name']
        if 'amount' in data: sponsor.amount = data['amount']
        if 'designation' in data: sponsor.designation = data['designation']
        if 'description' in data: sponsor.description = data['description']
        
        db.session.commit()
        return jsonify({'message': 'Sponsor updated successfully', 'sponsor': sponsor.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update sponsor: {str(e)}'}), 500

@app.route('/api/sponsors/<id>', methods=['DELETE'])
@token_required
@admin_required
def delete_sponsor(current_user, id):
    try:
        sponsor = Sponsor.query.get(id)
        if not sponsor:
            return jsonify({'message': 'Sponsor not found'}), 404
            
        db.session.delete(sponsor)
        db.session.commit()
        return jsonify({'message': 'Sponsor deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete sponsor: {str(e)}'}), 500

# ==================== FRONTEND ROUTES ====================
@app.route('/')
def serve_index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(PROJECT_ROOT, filename)

# ==================== MAIN ====================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        admin_user = User.query.filter_by(email='admin@example.com').first()
        if not admin_user:
            admin = User(
                name='Administrator',
                email='admin@example.com',
                phone='+91 98765 43210',
                password_hash=hash_password('admin123'),
                role='admin',
                status='active'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created: admin@example.com / admin123")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
