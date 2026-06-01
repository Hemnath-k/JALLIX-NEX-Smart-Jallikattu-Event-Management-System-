import os
from dotenv import load_dotenv

load_dotenv()

# Flask Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'jallixnex-secret-key-2024')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# ============================================
# PostgreSQL Database Configuration
# ============================================
# For Render: Use the DATABASE_URL environment variable
# For local development: Use individual PostgreSQL credentials

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use DATABASE_URL from Render
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    # Fix postgres:// URLs (deprecated in newer psycopg2)
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
else:
    # Development: Use individual credentials
    PG_HOST = os.getenv('PG_HOST', 'localhost')
    PG_PORT = int(os.getenv('PG_PORT', 5432))
    PG_USER = os.getenv('PG_USER', 'postgres')
    PG_PASSWORD = os.getenv('PG_PASSWORD', 'postgres')
    PG_DB = os.getenv('PG_DB', 'jallikattu_db')
    SQLALCHEMY_DATABASE_URI = f'postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}'

# PostgreSQL engine options
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_recycle': 300,
    'pool_pre_ping': True,
    'pool_size': 10,
    'max_overflow': 20,
}

SQLALCHEMY_TRACK_MODIFICATIONS = False

# Upload Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jallixnex-jwt-secret-2024')
JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

# Pagination
ITEMS_PER_PAGE = 20
