# Flask Backend for JALLIX-NEX Jallikattu Management System

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Database
Edit `config.py` and update MySQL credentials:
```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_password'
MYSQL_DB = 'jallikattu_db'
```

### 3. Initialize Database
Run the app to auto-create tables, or manually:
```bash
python init_db.py
```

### 4. Run the Server
```bash
python app.py
```

The API will be available at `http://localhost:5000`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

#### Bulls
- `GET /api/bulls` - Get all bulls
- `GET /api/bulls/<id>` - Get bull by ID
- `POST /api/bulls` - Register new bull
- `PUT /api/bulls/<id>` - Update bull
- `DELETE /api/bulls/<id>` - Delete bull
- `POST /api/bulls/<id>/verify` - Verify bull

#### Tamers
- `GET /api/tamers` - Get all tamers
- `GET /api/tamers/<id>` - Get tamer by ID
- `POST /api/tamers` - Register new tamer
- `PUT /api/tamers/<id>` - Update tamer
- `DELETE /api/tamers/<id>` - Delete tamer
- `POST /api/tamers/<id>/verify` - Verify tamer

#### Events
- `GET /api/events` - Get all events
- `GET /api/events/<id>` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/<id>` - Update event
- `DELETE /api/events/<id>` - Delete event
- `POST /api/events/<id>/book` - Book slot for event

#### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Process new payment
- `PUT /api/payments/<id>/approve` - Approve payment
- `PUT /api/payments/<id>/reject` - Reject payment
- `POST /api/payments/<id>/refund` - Refund payment

### Frontend Integration
Update your JavaScript files to make API calls to the Flask backend instead of using localStorage.

