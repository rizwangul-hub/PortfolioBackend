import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },
    examType: {
      type: String,
      required: true,
    },
    score: {
      type: Number, // Percentage score
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    wrongAnswers: {
      type: Number,
      required: true,
    },
    skippedQuestions: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number, // In seconds
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedAnswer: {
          type: String,
          default: "",
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    analysis: {
      weakAreas: {
        type: [String],
        default: [],
      },
      strongAreas: {
        type: [String],
        default: [],
      },
      subjectPerformance: [
        {
          subject: String,
          total: Number,
          correct: Number,
          percentage: Number,
        },
      ],
      speedAnalysis: String,
      accuracyAnalysis: String,
      recommendation: String,
    },
    certificateGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;
