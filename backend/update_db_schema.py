import os
import pymysql
from dotenv import load_dotenv
from app import app, db
import traceback

load_dotenv()

def update_schema():
    print("Starting database schema update...")
    
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '1234')
    MYSQL_DB = os.getenv('MYSQL_DB', 'jallikattu_db')
    
    # Direct DB connection to run ALTER TABLE
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            # Check if columns exist first
            cursor.execute("SHOW COLUMNS FROM events LIKE 'start_time'")
            result = cursor.fetchone()
            if not result:
                print("Adding start_time column to events table...")
                cursor.execute("ALTER TABLE events ADD COLUMN start_time VARCHAR(10) DEFAULT '08:00'")
            else:
                print("start_time column already exists.")
                
            cursor.execute("SHOW COLUMNS FROM events LIKE 'end_time'")
            result = cursor.fetchone()
            if not result:
                print("Adding end_time column to events table...")
                cursor.execute("ALTER TABLE events ADD COLUMN end_time VARCHAR(10) DEFAULT '17:00'")
            else:
                print("end_time column already exists.")
                
        connection.commit()
        connection.close()
        print("Schema altered successfully.")
    except Exception as e:
        print(f"Error altering schema: {e}")
        traceback.print_exc()

    # Now use SQLAlchemy to create new tables like sponsors
    with app.app_context():
        try:
            db.create_all()
            print("SQLAlchemy create_all executed successfully.")
        except Exception as e:
            print(f"Error creating new tables: {e}")
            traceback.print_exc()

if __name__ == '__main__':
    update_schema()
