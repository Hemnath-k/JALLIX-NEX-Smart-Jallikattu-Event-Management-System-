import os
from dotenv import load_dotenv

load_dotenv()

# Flask Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'jallixnex-secret-key-2024')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

# ============================================
# MySQL Database Configuration
# ============================================
# Update these with your MySQL credentials

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '1234')  # Your MySQL password
MYSQL_DB = os.getenv('MYSQL_DB', 'jallikattu_db')

# MySQL Database URI
SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'

# For MySQL, we need these engine options
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_recycle': 300,
    'pool_pre_ping': True,
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
