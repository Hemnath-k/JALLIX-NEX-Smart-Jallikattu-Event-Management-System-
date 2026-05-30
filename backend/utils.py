import hashlib
import secrets
from datetime import datetime, timedelta

def hash_password(password):
    """Hash a password using SHA-256"""
    # In production, use bcrypt or argon2
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"

def verify_password(password, password_hash):
    """Verify a password against its hash"""
    try:
        salt, pwd_hash = password_hash.split('$')
        return pwd_hash == hashlib.sha256((password + salt).encode()).hexdigest()
    except:
        return False

def generate_token(length=32):
    """Generate a random token"""
    return secrets.token_urlsafe(length)

def generate_id(prefix='ID'):
    """Generate a unique ID with prefix"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = secrets.token_hex(4)
    return f"{prefix}_{timestamp}_{random_part}"

def format_date(date_obj):
    """Format date to ISO string"""
    if date_obj:
        return date_obj.isoformat()
    return None

def get_expiry_date(days=365):
    """Get expiry date from now"""
    return datetime.utcnow() + timedelta(days=days)

def is_valid_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_phone(phone):
    """Basic phone validation (Indian format)"""
    import re
    pattern = r'^[6-9]\d{9}$'
    cleaned = re.sub(r'\D', '', phone)
    return len(cleaned) == 10 and re.match(pattern, cleaned) is not None

