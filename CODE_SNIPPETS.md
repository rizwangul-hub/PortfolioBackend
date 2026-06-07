# Complete Code Snippets - Copy & Paste Ready

## 1. vercel.json (Backend/vercel.json)

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

---

## 2. Backend/index.js (Root Entry Point - Local Dev)

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/testRoutes.js";
import adminDashboardRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import projectRoutes from "./routes/project.js";
import { connectionDB } from "./config/db.js";
import { sanitizeInput } from "./middleware/security.js";

// Load environment variables
dotenv.config();

// Connect to database
connectionDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());

// Allowed frontend URLs
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173,https://full-stack-portfolio-4uixfdeer-rizwangul-hubs-projects.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, mobile apps, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        console.log("Blocked Origin:", cleanOrigin);
        callback(new Error(`CORS policy: origin ${cleanOrigin} not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(sanitizeInput);

// Main route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the SmartPrep AI Backend API",
    status: "active",
    endpoints: {
      auth: "/api/auth",
      tests: "/api/tests",
      students: "/api/students",
      admin: "/api/admin",
      projects: "/api/projects",
      health: "/api/health",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/projects", projectRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start server for local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
```

---

## 3. Backend/api/index.js (Vercel Serverless Handler)

```javascript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "../routes/auth.js";
import testRoutes from "../routes/testRoutes.js";
import adminDashboardRoutes from "../routes/adminRoutes.js";
import studentRoutes from "../routes/studentRoutes.js";
import projectRoutes from "../routes/project.js";
import { connectionDB } from "../config/db.js";
import { sanitizeInput } from "../middleware/security.js";

// Load environment variables
dotenv.config();

// Connect to database
connectionDB();

const app = express();

// Security Middlewares
app.use(helmet());

// Allowed frontend URLs
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173,https://full-stack-portfolio-4uixfdeer-rizwangul-hubs-projects.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, mobile apps, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        console.log("Blocked Origin:", cleanOrigin);
        callback(new Error(`CORS policy: origin ${cleanOrigin} not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(sanitizeInput);

// Main entry route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the SmartPrep AI Backend API",
    status: "active",
    endpoints: {
      auth: "/api/auth",
      tests: "/api/tests",
      students: "/api/students",
      admin: "/api/admin",
      projects: "/api/projects",
      health: "/api/health",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/projects", projectRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Export for Vercel serverless
export default app;
```

---

## 4. Backend/package.json (Scripts Section)

Only the scripts section - keep all dependencies unchanged:

```json
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "build": "echo 'Build complete'"
  },
```

---

## 5. Backend/.env (Required Variables)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster0.mongodb.net/database_name

# Authentication
JWT_SECRET=your_very_strong_jwt_secret_key_here_at_least_32_chars

# Frontend URLs (comma-separated)
FRONTEND_URL=http://localhost:5173,https://your-deployed-frontend.vercel.app

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
OPENAI_API_KEY=sk-proj-your_openai_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_key_here

# Email Configuration (Mailtrap or similar)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

---

## 6. Frontend/.env (Update API URL for Production)

```env
VITE_API_URL=https://your-deployed-backend.vercel.app/api
```

---

## How to Place Files

```
FullStack_Portfolio/
├── Backend/
│   ├── api/
│   │   └── index.js              ← Create this NEW FILE
│   ├── vercel.json               ← Create this NEW FILE
│   ├── index.js                  ← Update with code above
│   ├── package.json              ← Update scripts section
│   ├── .env                       ← Update with env vars
│   ├── routes/
│   ├── config/
│   ├── controller/
│   └── ... (rest of files)
│
└── Frontend/
    ├── .env                      ← Update API URL
    └── ... (rest of files)
```

---

## Deployment Commands

### 1. Stage Changes

```bash
cd Backend
git add .
git status  # Verify changes
```

### 2. Commit

```bash
git commit -m "feat: Configure backend for Vercel serverless deployment

- Create vercel.json with route configuration
- Create api/index.js as serverless handler
- Update index.js to export app and conditional listen
- Add build script to package.json
- Support both local development and Vercel production"
```

### 3. Push

```bash
git push
```

### 4. Vercel Deployment

Option A: **Via Vercel Dashboard**

1. Go to vercel.com
2. Click "Add New" → "Project"
3. Import GitHub repo
4. **Select "Backend" as root directory** ⚠️
5. Click "Deploy"

Option B: **Via Vercel CLI**

```bash
npm i -g vercel
cd Backend
vercel
# Follow prompts
```

---

## Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
MONGO_URL=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:5173,https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy_...
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
NODE_ENV=production
```

---

## Testing URLs

After deployment, test these:

```bash
# Root endpoint (should return JSON)
curl https://your-backend.vercel.app/

# Health check
curl https://your-backend.vercel.app/api/health

# Projects endpoint
curl https://your-backend.vercel.app/api/projects

# Auth endpoint
curl https://your-backend.vercel.app/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Local Testing (Before Deployment)

```bash
# Start backend
cd Backend
npm run dev
# Server on http://localhost:5000

# In another terminal, test
curl http://localhost:5000/
curl http://localhost:5000/api/health
curl http://localhost:5000/api/projects
```

---

## Summary

✅ All code snippets above are production-ready
✅ Copy-paste into correct files as shown
✅ Push to GitHub
✅ Connect to Vercel
✅ Set environment variables
✅ Deploy
✅ Test endpoints

**Backend now properly serves API on Vercel! 🚀**
