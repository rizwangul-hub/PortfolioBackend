import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    statement: {
      type: String,
      required: [true, "Question statement is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function(val) {
          return val.length === 4;
        },
        message: "A question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    category: {
      type: String,
      required: [true, "Subject category is required"],
      trim: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    examType: {
      type: String,
      required: [true, "Exam type is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
