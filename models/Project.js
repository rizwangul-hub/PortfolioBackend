import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
    },
    image: {
      type: String,
      required: [true, "Project image is required"],
    },
    liveLink: {
      type: String,
      required: [true, "Live demo link is required"],
      trim: true,
    },
    githubLink: {
      type: String,
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model("Project", projectSchema);
