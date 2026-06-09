import mongoose from "mongoose";

const cached = globalThis.mongooseCache || { conn: null, promise: null };
if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

mongoose.connection.on("connected", () => {
  console.log(
    "✅ MongoDB connected (readyState:",
    mongoose.connection.readyState,
    ")",
  );
});

mongoose.connection.on("error", (error) => {
  console.error("❌ MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

export const connectionDB = async () => {
  const mongoUrl = String(process.env.MONGO_URL || "").trim();

  if (!mongoUrl) {
    throw new Error(
      "MONGO_URL is not configured. Add it to Backend/.env or Vercel environment variables.",
    );
  }

  // Reuse existing connection when available (serverless-friendly)
  if (cached.conn) {
    console.log("✅ Reusing existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🔌 Establishing new MongoDB connection...");
    cached.promise = (async () => {
      try {
        const mongooseInstance = await mongoose.connect(mongoUrl, {
          dbName: process.env.DB_NAME,
          bufferCommands: false,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        });

        cached.conn = mongooseInstance;
        console.log("✅ MongoDB connection established");
        return mongooseInstance;
      } catch (err) {
        cached.promise = null;
        console.error("❌ MongoDB connection failed:", err);
        throw err;
      }
    })();
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
