import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Skill category is required"],
      trim: true,
    },
    iconName: {
      type: String,
      default: "Atom",
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export const Skill = mongoose.model("Skill", skillSchema);
