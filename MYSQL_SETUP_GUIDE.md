# MySQL Setup Guide for JALLIX-NEX

## Step 1: Install MySQL

### Windows:
1. Download MySQL Installer from: https://dev.mysql.com/downloads/installer/
2. Run the installer and choose "Server only" or "Full" installation
3. Set your root password during installation
4. Remember this password - you'll need it!

### Or use XAMPP (Easier):
1. Download XAMPP from: https://www.apachefriends.org/
2. Install and start MySQL from XAMPP Control Panel

## Step 2: Create Database

Open MySQL command line or MySQL Workbench and run:

```sql
CREATE DATABASE jallikattu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 3: Update Configuration

### Option A: Edit config.py directly

Open `backend/config.py` and update these lines:

```python
# Change from SQLite to MySQL
MYSQL_HOST = 'localhost'
MYSQL_PORT = 3306
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'YOUR_MYSQL_PASSWORD_HERE'  # <-- Put your password here
MYSQL_DB = 'jallikattu_db'

# Use MySQL URI
SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'

# Keep these for MySQL
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_recycle': 300,
    'pool_pre_ping': True,
}
```

### Option B: Use Environment Variables (Recommended)

Create a `.env` file in the `backend` folder:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DB=jallikattu_db
SECRET_KEY=jallixnex-secret-key-2024
```

## Step 4: Install PyMySQL

Make sure you have the MySQL driver installed:

```bash
cd backend
pip install PyMySQL
```

Or if you have requirements.txt:
```bash
pip install -r requirements.txt
```

## Step 5: Test the Connection

1. Start the backend:
```bash
cd backend
python app.py
```

2. Initialize the database:
```
Visit: http://localhost:5000/api/init-db
```

3. Check if tables were created:
```sql
USE jallikattu_db;
SHOW TABLES;
```

You should see: bookings, bulls, certificates, events, payments, slots, tamers, users

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Wrong password in config.py
- MySQL root user has different authentication method

Fix:
```sql
-- In MySQL, run:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Error: "Can't connect to MySQL server"
- MySQL service is not running
- Wrong host/port in configuration

Fix:
- Start MySQL service (Windows: Services app, find MySQL and start it)
- Check if MySQL is running on port 3306

### Error: "Unknown database 'jallikattu_db'"
- Database doesn't exist

Fix:
```sql
CREATE DATABASE jallikattu_db;
```

### Error: "No module named 'pymysql'"
- PyMySQL not installed

Fix:
```bash
pip install PyMySQL
```

## Quick Reference: config.py for MySQL

```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY', 'jallixnex-secret-key-2024')
DEBUG = True

# MySQL Configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'YOUR_PASSWORD')
MYSQL_DB = os.getenv('MYSQL_DB', 'jallikattu_db')

# MySQL Database URI
SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'

# MySQL Engine Options
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_recycle': 300,
    'pool_pre_ping': True,
}

SQLALCHEMY_TRACK_MODIFICATIONS = False
```

## Need Help?

If you get stuck, you can:
1. Use SQLite instead (already working) - just keep the current config.py
2. Check MySQL logs in XAMPP or MySQL Workbench
3. Verify MySQL is running: `mysql -u root -p` in command line
