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
  })
);

app.use(express.json());
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

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});