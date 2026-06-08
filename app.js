import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import adminDashboardRoutes from "./routes/adminRoutes.js";
import projectRoutes from "./routes/project.js";
import contactRoutes from "./routes/contact.js";
import { sanitizeInput, apiLimiter } from "./middleware/security.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        console.warn("Blocked Origin:", cleanOrigin);
        callback(new Error(`CORS policy: origin ${cleanOrigin} not allowed`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(sanitizeInput);
app.use(apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SmartPrep AI Backend API",
    status: "active",
    endpoints: {
      health: "/api/health",
      projects: "/api/projects",
      admin: "/api/admin",
      contact: "/api/contact",
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
