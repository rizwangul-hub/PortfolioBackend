import path from "path";
import { fileURLToPath } from "url";
import "./config/env.js";
import app from "./app.js";
import { connectionDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startServer = async () => {
  try {
    await connectionDB();

    const PORT = parseInt(process.env.PORT, 10) || 5001;

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Stop the process using this port or set a different PORT value.`,
        );
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
