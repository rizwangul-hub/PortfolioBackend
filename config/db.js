import mongoose from "mongoose";

export const connectionDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.warn(
      "⚠️  MONGO_URL is not set. Skipping DB connection (serverless-safe).",
    );
    return;
  }

  try {
    // Use recommended options to avoid deprecation warnings
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database Connected Successfully");
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    // Do not exit in serverless environments; allow function to handle connection errors
  }
};
