import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Test title is required"],
      trim: true,
    },
    examType: {
      type: String,
      required: [true, "Exam type is required"],
      trim: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    duration: {
      type: Number,
      default: 100, // Duration in minutes
    },
    passingScore: {
      type: Number,
      default: 50, // Passing percentage
    },
    description: {
      type: String,
      default: "",
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Test = mongoose.model("Test", testSchema);
export default Test;
