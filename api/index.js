import "../config/env.js";
import app from "../app.js";
import { connectionDB } from "../config/db.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Ensure the serverless entry warms up the DB connection before handling requests.
// Top-level await ensures Vercel/Lambda handlers won't run queries before connect.
try {
  await connectionDB();
  console.log("✅ Serverless MongoDB connection ready");
} catch (error) {
  console.error("❌ Serverless MongoDB connection failed:", error);
  // rethrow so that deployment/logs show the failure clearly
  throw error;
}

export default app;
