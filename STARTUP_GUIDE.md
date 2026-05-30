# JALLIX-NEX - How to Start the Application

## ⚠️ IMPORTANT: You MUST use a web server to access the frontend!

Opening HTML files directly (double-clicking) will NOT work because:
- The browser uses `file://` protocol instead of `http://`
- API calls to `http://localhost:5000` are blocked by CORS
- You'll see "No endpoint found" or CORS errors

## ✅ Correct Way to Start

### Option 1: Use the Batch File (Windows) - EASIEST
1. Double-click `start.bat` in the Jallikattu Website folder
2. Wait for both server windows to open
3. Open your browser to: http://localhost:8080/login.html
4. The application will connect to the backend automatically

### Option 2: Manual Start (Any OS)

**Step 1: Start the Backend**
```bash
cd backend
python app.py
```
Backend will run on: http://localhost:5000

**Step 2: Start Frontend Server** (in a new terminal)
```bash
# In the Jallikattu Website folder (NOT in backend)
python -m http.server 8080
```

**Step 3: Open Browser**
Go to: http://localhost:8080/login.html

## 🔧 Troubleshooting

### "No endpoint found" error
- Make sure you're accessing via http://localhost:8080, NOT file://
- Check that the backend is running on http://localhost:5000
- Both servers must be running

### CORS errors in browser console
- This happens when opening HTML files directly
- Use http://localhost:8080 instead of file://

### Backend not starting
- Check Python is installed: `python --version`
- Install dependencies: `cd backend && pip install -r requirements.txt`

### Database issues
- Initialize database: Visit http://localhost:5000/api/init-db
- Or use curl: `curl http://localhost:5000/api/init-db`

## 📋 API Endpoints Available

Once running, these endpoints work:
- GET http://localhost:5000/api/events - List events
- POST http://localhost:5000/api/auth/register - Register user
- POST http://localhost:5000/api/auth/login - Login user
- GET http://localhost:5000/api/bulls - List bulls (requires auth)
- And many more...

## 🧪 Quick Test

1. Start both servers using `start.bat`
2. Open http://localhost:8080/events.html
3. You should see the event "Alanganallur Jallikattu" loaded from the database
4. If you see events listed, the connection is working!

## 📞 Need Help?

If you still see "No endpoint found":
1. Check both command windows are open (backend + frontend server)
2. Make sure you're using http://localhost:8080, not file://
3. Check browser console (F12) for specific error messages
