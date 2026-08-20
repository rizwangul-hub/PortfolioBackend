import mongoose from "mongoose";

const portfolioProfileSchema = new mongoose.Schema(
  {
    heroImage: {
      type: String,
      default: "",
    },
    aboutImage: {
      type: String,
      default: "",
    },
    yearsExperience: {
      type: String,
      default: "1+",
    },
    passion: {
      type: String,
      default: "100%",
    },
    aboutTitle: {
      type: String,
      default: "MERN Stack Developer",
    },
    aboutDescription: {
      type: String,
      default: "",
    },
    customProjectsCount: {
      type: Number,
      default: null, // null means use actual DB count of Projects
    },
  },
  {
    timestamps: true,
  },
);

export const PortfolioProfile = mongoose.model(
  "PortfolioProfile",
  portfolioProfileSchema,
);
