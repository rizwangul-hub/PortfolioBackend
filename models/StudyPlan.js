import mongoose from "mongoose";

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user has one active AI Study Plan
    },
    examType: {
      type: String,
      required: true,
    },
    dailyPlan: [
      {
        day: { type: String, required: true }, // e.g. "Day 1", "Monday"
        topics: [String],
        hours: Number,
        isCompleted: { type: Boolean, default: false },
      },
    ],
    weeklyPlan: [
      {
        week: { type: String, required: true }, // e.g. "Week 1"
        goals: [String],
        isCompleted: { type: Boolean, default: false },
      },
    ],
    monthlyPlan: [
      {
        month: { type: String, required: true }, // e.g. "Month 1"
        focus: String,
        isCompleted: { type: Boolean, default: false },
      },
    ],
    weakSubjects: [String],
    strongSubjects: [String],
    availableHoursPerDay: {
      type: Number,
      default: 4,
    },
  },
  { timestamps: true }
);

const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);
export default StudyPlan;
