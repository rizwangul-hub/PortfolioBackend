import "../config/env.js";
import app from "../app.js";
import { connectionDB } from "../config/db.js";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Initialize DB connection before exporting app. In Vercel this module is imported
// and must be ready to handle requests. For local dev, also start a listener
// when not running inside Vercel.
try {
  await connectionDB();
  console.log("✅ MongoDB connection ready (api/index.js)");
} catch (error) {
  console.error("❌ MongoDB connection failed (api/index.js):", error);
  // If running in serverless (VERCEL=1) rethrow to surface failure to the platform.
  if (process.env.VERCEL) throw error;
  // For local dev, exit to avoid running without DB.
  process.exit(1);
}

// If running locally (not Vercel), start a traditional HTTP server so `node api/index.js`
// works for development. Vercel ignores this when importing the module.
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT, 10) || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Local server listening on http://localhost:${PORT}`);
  });
}

export default app;
