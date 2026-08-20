import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
    },
    iconName: {
      type: String,
      default: "Globe",
      trim: true,
    },
    techStack: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const Service = mongoose.model("Service", serviceSchema);
