#!/usr/bin/env python3
"""
JALLIX-NEX Startup Script
Starts both the Flask backend and a simple HTTP server for the frontend
"""

import subprocess
import sys
import os
import threading
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket

def get_local_ip():
    """Get the local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def start_flask_backend():
    """Start the Flask backend server"""
    print("🚀 Starting Flask Backend...")
    print("   Location: http://localhost:5000")
    print("   API Docs: http://localhost:5000/api/init-db (initialize DB)")
    print()
    
    # Change to backend directory and start Flask
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    os.chdir(backend_dir)
    
    # Run Flask app
    subprocess.run([sys.executable, 'app.py'])

def start_frontend_server():
    """Start simple HTTP server for frontend"""
    time.sleep(2)  # Wait for backend to start
    
    port = 8080
    os.chdir(os.path.dirname(__file__))
    
    # Create custom handler that adds CORS headers
    class CORSRequestHandler(SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            super().end_headers()
        
        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()
    
    server = HTTPServer(('0.0.0.0', port), CORSRequestHandler)
    
    local_ip = get_local_ip()
    
    print("🌐 Starting Frontend Server...")
    print(f"   Local:   http://localhost:{port}")
    print(f"   Network: http://{local_ip}:{port}")
    print()
    print("📋 Available Pages:")
    print(f"   - Login:    http://localhost:{port}/login.html")
    print(f"   - Events:   http://localhost:{port}/events.html")
    print(f"   - Bulls:    http://localhost:{port}/bulls.html")
    print(f"   - Tamers:   http://localhost:{port}/tamers.html")
    print(f"   - Dashboard: http://localhost:{port}/dashboard.html")
    print()
    print("⚠️  Make sure both servers are running before accessing the application")
    print("=" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\nShutting down servers...")

if __name__ == '__main__':
    print("=" * 60)
    print("   JALLIX-NEX Management System")
    print("   Starting Servers...")
    print("=" * 60)
    print()
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=start_flask_backend, daemon=True)
    backend_thread.start()
    
    # Start frontend server in main thread
    start_frontend_server()
