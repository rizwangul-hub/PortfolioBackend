# Vercel Deployment Guide - Backend (Express/Node.js)

## Root Cause Analysis

Your backend was displaying source code instead of serving API responses because:

1. **Missing `vercel.json`** - Vercel didn't know how to handle your project
2. **app.listen() in index.js** - Serverless functions can't use traditional server binding
3. **No API route handler** - Vercel expects `/api` directory with export default handler
4. **Wrong project structure** - Not configured for Vercel's serverless architecture
5. **Missing build script** - package.json lacked proper build command

---

## Files Created/Modified

### 1. **Backend/vercel.json** (NEW FILE)

- Tells Vercel how to handle requests
- Routes all requests to `/api/index.js`
- Configures CORS headers
- Sets Node.js runtime to 20.x

### 2. **Backend/api/index.js** (NEW FILE)

- Vercel serverless handler (exports the Express app)
- Same code as root index.js but in serverless-compatible location
- Used by Vercel to handle all API requests

### 3. **Backend/index.js** (MODIFIED)

- Now exports app for Vercel: `export default app;`
- Conditional server start: `if (process.env.NODE_ENV !== "production")`
- Only calls `app.listen()` during local development
- Works for both local development AND Vercel

### 4. **Backend/package.json** (MODIFIED)

- Added `"build": "echo 'Build complete'"` script
- Kept `"start"` for local development
- Vercel automatically installs dependencies

---

## File Structure Required

```
Backend/
├── api/
│   └── index.js                 ← VERCEL ENTRY POINT
├── config/
│   ├── cloudinary.js
│   └── db.js
├── controller/
├── middleware/
├── models/
├── modules/
├── routes/
├── index.js                     ← Local dev entry point
├── package.json                 ← Updated
├── .env                         ← MUST SET IN VERCEL
└── vercel.json                  ← NEW FILE
```

---

## Environment Variables to Set on Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your_strong_secret_key
FRONTEND_URL=http://localhost:5173,https://your-frontend-vercel-url.vercel.app
PORT=5000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=sk-proj-your_key
GEMINI_API_KEY=your_key
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass
```

---

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd Backend
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Choose the **Backend** folder as root directory
5. Click "Deploy"

### Step 3: Set Environment Variables

1. After deployment, go to Project Settings
2. Click "Environment Variables"
3. Add all variables from the list above
4. Click "Save"

### Step 4: Redeploy

1. Go back to Deployments
2. Click the latest deployment
3. Click "Redeploy"

### Step 5: Verify Deployment

Test with these URLs:

```
https://your-backend-url.vercel.app/
→ Should return JSON with API endpoints

https://your-backend-url.vercel.app/api/health
→ Should return {"status": "OK", ...}

https://your-backend-url.vercel.app/api/projects
→ Should return projects list
```

---

## How It Works Now

**Local Development:**

```
npm run dev
↓
Runs index.js
↓
app.listen(5000)
↓
Express server running on localhost:5000
```

**Production (Vercel):**

```
Incoming request
↓
Vercel routes to /api/index.js
↓
Handler exports app
↓
Express processes request
↓
Returns API response (not source code!)
```

---

## Common Issues & Fixes

### Issue: Still seeing source code

**Solution:** Clear Vercel cache and redeploy

1. Go to Project Settings → Git
2. Click "Redeploy"
3. Select "Force rebuild"

### Issue: CORS errors

**Solution:** Update `FRONTEND_URL` in Vercel env vars with deployed frontend URL

```
FRONTEND_URL=http://localhost:5173,https://your-frontend.vercel.app
```

### Issue: MongoDB connection timeout

**Solution:** Whitelist Vercel IPs in MongoDB Atlas

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (Vercel uses dynamic IPs)
3. Or restrict to Vercel's IP range

### Issue: 502 Bad Gateway

**Solution:** Check logs in Vercel dashboard

1. Go to Deployments → Latest
2. Click "View Logs"
3. Look for error messages
4. Most common: Missing env variables

---

## File Contents (Complete Reference)

### Backend/vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm install",
  "env": {
    "NODEJS_RUNTIME": "nodejs20.x"
  },
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
        }
      ]
    }
  ]
}
```

### Backend/package.json (scripts section)

```json
"scripts": {
  "start": "node index.js",
  "dev": "node --watch index.js",
  "build": "echo 'Build complete'"
}
```

---

## Why This Works

✅ `vercel.json` tells Vercel this is a Node.js project
✅ Routes all requests to `/api/index.js` handler
✅ `/api/index.js` exports Express app (serverless-compatible)
✅ Root `index.js` still works for local development
✅ `export default app` allows Vercel to call the function
✅ Environment variables are properly loaded
✅ CORS is configured for serverless

---

## Testing Checklist

After deployment, verify:

- [ ] Root route returns JSON (not source code)
- [ ] Health endpoint responds
- [ ] API routes work (auth, projects, etc.)
- [ ] CORS allows frontend origin
- [ ] Environment variables are set
- [ ] MongoDB connection works
- [ ] Cloudinary uploads work
- [ ] No 502 errors in logs
- [ ] Frontend can fetch data

---

## Support & Debugging

**Check Vercel Logs:**

```
Vercel Dashboard → Deployments → Latest → View Logs
```

**Test API locally first:**

```bash
cd Backend
npm run dev
curl http://localhost:5000/
curl http://localhost:5000/api/health
```

**Check MongoDB connectivity:**

```
Verify connection string in .env
Check IP whitelist in MongoDB Atlas
```

**Test CORS:**

```
Browser console will show CORS errors if frontend origin isn't allowed
Add your deployed frontend URL to FRONTEND_URL env var
```

---

**Result:** Backend now deploys to Vercel and serves API responses instead of source code! 🚀
