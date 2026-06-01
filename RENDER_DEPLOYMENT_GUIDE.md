# Deploying JALLIX-NEX to Render

## Step 1: Prepare Your Repository

1. **Push to GitHub**
   - Create a GitHub repository
   - Commit all your code
   - Push to GitHub (Render requires a git repository)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -m main
git remote add origin https://github.com/YOUR-USERNAME/jallix-nex.git
git push -u origin main
```

## Step 2: Set Up PostgreSQL Database on Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click **"New +"** → **"PostgreSQL"**
4. Configure:
   - **Name:** jallix-db
   - **Database:** jallikattu_db
   - **User:** (auto-generated, save it)
   - **Region:** (closest to you)
5. Click **"Create Database"**
6. Wait for database to be ready (2-3 minutes)
7. Copy the **External Database URL** (looks like: `postgresql://user:password@host:5432/jallikattu_db`)

## Step 3: Deploy Backend

1. Go to https://render.com dashboard
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repository
4. Configure:
   - **Name:** jallix-backend
   - **Environment:** Python
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
   - **Plan:** Free or Starter

5. **Add Environment Variables:**
   - Click **"Advanced"** → **"Add Environment Variable"**
   - Add these variables:

```
FLASK_ENV=production
DEBUG=False
SECRET_KEY=<generate a random key>
JWT_SECRET_KEY=<generate a random key>
DATABASE_URL=<paste the PostgreSQL URL from Step 2>
ALLOWED_ORIGINS=https://jallix-frontend.onrender.com,https://your-custom-domain.com
```

6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. Copy the backend URL (e.g., `https://jallix-backend.onrender.com`)

## Step 4: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Select your GitHub repository
3. Configure:
   - **Name:** jallix-frontend
   - **Build Command:** (leave empty)
   - **Publish Directory:** `.` (current directory)

4. Click **"Create Static Site"**
5. Copy the frontend URL (e.g., `https://jallix-frontend.onrender.com`)

## Step 5: Update Frontend API Configuration

Update your frontend JavaScript files to use the production backend URL:

**File: `js/main.js` or wherever your API calls are made**

```javascript
// Before (development)
const API_BASE = 'http://localhost:5000/api';

// After (production)
const API_BASE = 'https://jallix-backend.onrender.com/api';
```

Or make it dynamic:

```javascript
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://jallix-backend.onrender.com/api';
```

## Step 6: Initialize Database

1. SSH into Render (or use Render Shell)
2. Run database initialization:

```bash
python backend/init_db.py
```

Or manually import your database schema using the PostgreSQL connection.

## Step 7: Update CORS in Backend

Edit `backend/app.py` CORS configuration:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://jallix-frontend.onrender.com",
            "https://your-custom-domain.com"  # if you add one
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})
```

## Step 8: Add Custom Domain (Optional)

1. In Render dashboard, go to your frontend service
2. Click **"Settings"**
3. Scroll to **"Custom Domains"**
4. Add your domain
5. Update your domain's DNS records according to Render's instructions

## Troubleshooting

### Backend shows "No database connection"
- Check that PostgreSQL database is running
- Verify `DATABASE_URL` environment variable is set correctly
- Check database URL format: `postgresql://user:password@host:port/dbname`

### CORS errors
- Update the `ALLOWED_ORIGINS` list in CORS configuration
- Make sure frontend and backend URLs are correct

### "502 Bad Gateway" error
- Check backend logs in Render dashboard
- Run: `python -m flask run` locally to test
- Verify all Python dependencies are in `requirements.txt`

### Frontend can't reach backend
- Check that `API_BASE` URL is correct in JavaScript
- Verify backend URL is publicly accessible
- Check browser console for exact error message

## Monitoring & Updates

1. **View Logs:** Click on your service → "Logs" tab
2. **Redeploy:** Push changes to GitHub (auto-deploys) or click "Manual Deploy"
3. **Update Dependencies:** Edit `requirements.txt` and push to GitHub

## Production Checklist

- [ ] Database is configured and working
- [ ] Environment variables are set
- [ ] CORS is configured for your domain
- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` and `JWT_SECRET_KEY` are secure
- [ ] Frontend API URLs point to production backend
- [ ] Database initialization script has run
- [ ] Test login, registration, and main features
