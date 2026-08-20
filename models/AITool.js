import mongoose from "mongoose";

const aiToolSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "AI Tool title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    iconName: {
      type: String,
      default: "FaRobot",
      trim: true,
    },
    accent: {
      type: String,
      default: "from-cyan-400 to-blue-500",
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const AITool = mongoose.model("AITool", aiToolSchema);
