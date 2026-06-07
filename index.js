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
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
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
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/projects", projectRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
