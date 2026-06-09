import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import adminDashboardRoutes from "./routes/adminRoutes.js";
import projectRoutes from "./routes/project.js";
import contactRoutes from "./routes/contact.js";
import { sanitizeInput, apiLimiter } from "./middleware/security.js";
import { connectionDB } from "./config/db.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://full-stack-portfolio-q7ej3qsc9-rizwangul-hubs-projects.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked Origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(sanitizeInput);
app.use(apiLimiter);

// Ensure DB connection is available before handling requests.
// In serverless environments this will await an existing cached connection or establish one.
app.use(async (req, res, next) => {
  try {
    await connectionDB();
    return next();
  } catch (err) {
    console.error("❌ DB unavailable for request:", err);
    return res
      .status(503)
      .json({ success: false, message: "Database unavailable" });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SmartPrep AI Backend API",
    status: "active",
    endpoints: {
      health: "/api/health",
      projects: "/api/projects",
      admin: "/api/admin",
      contact: "/api/contact",
      frontend: process.env.FRONTEND_URL || "http://localhost:5173",
    },
  });
});

app.use("/api/admin", adminDashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);

app.get("/api/health", (req, res) => {
  const dbState =
    mongoose.connection.readyState === 1 ? "Connected" : "Not connected";

  res.status(200).json({
    status: "OK",
    dbState,
    envConfigured: Boolean(process.env.MONGO_URL),
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;
