import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    aiProvider: {
      type: String,
      enum: ["openai", "gemini"],
      default: "gemini",
    },
    openaiKey: {
      type: String,
      default: "",
    },
    geminiKey: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);
export default AdminSettings;
