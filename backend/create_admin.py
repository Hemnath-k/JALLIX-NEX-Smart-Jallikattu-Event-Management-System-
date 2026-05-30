# This file adds a route to create default admin user
# Run this to create the admin user in your database

# Add this to app.py after the init_database function:

"""
# ==================== CREATE DEFAULT ADMIN ====================
@app.route('/api/create-admin', methods=['POST'])
def create_default_admin():
    try:
        # Check if admin already exists
        admin_user = User.query.filter_by(email='admin@example.com').first()
        if admin_user:
            return jsonify({
                'message': 'Admin user already exists',
                'user': admin_user.to_dict()
            }), 200
        
        # Create admin user
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
        
        return jsonify({
            'message': 'Admin user created successfully',
            'email': 'admin@example.com',
            'password': 'admin123'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create admin: {str(e)}'}), 500
"""
