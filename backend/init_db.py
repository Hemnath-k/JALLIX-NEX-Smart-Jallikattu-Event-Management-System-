import os
from app import app, db

def init_db():
    print("Initializing database...")
    with app.app_context():
        # Create all tables
        try:
            db.create_all()
            print("Database initialized successfully!")
            print("All tables have been created.")
        except Exception as e:
            print(f"Error initializing database: {e}")

if __name__ == '__main__':
    init_db()
