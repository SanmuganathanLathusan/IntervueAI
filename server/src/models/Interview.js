const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: String,
    question: String,
    answer: String,
    score: Number,
    feedback: String,
    improvedAnswer: String,
    strengths: [String],
    weaknesses: [String],
    improvementTips: [String],
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: String,
    category: String,
    question: String,
    idealAnswer: String,
    tips: [String],
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pdfText: {
      type: String,
      required: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    scores: {
      type: [Number],
      default: [],
    },
    scoreSummary: {
      totalScore: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      strengths: {
        type: [String],
        default: [],
      },
      weaknesses: {
        type: [String],
        default: [],
      },
      improvementTips: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', interviewSchema);
