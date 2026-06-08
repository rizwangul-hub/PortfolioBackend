import "../config/env.js";
import app from "../app.js";
import { connectionDB } from "../config/db.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

connectionDB().catch((error) => {
  console.error("❌ Serverless MongoDB connection failed:", error);
});

export default app;
