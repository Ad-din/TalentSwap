const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: { type: [String], required: true, validate: (v) => v.length >= 2 },
    correctOptionIndex: { type: Number, required: true },
    points: { type: Number, default: 1 },
  },
  { _id: true }
);

const assessmentSchema = new Schema(
  {
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    questions: { type: [questionSchema], required: true },

    // Admin-managed. Determines the "level - Verified" label thresholds.
    passingScorePercent: { type: Number, default: 70 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
