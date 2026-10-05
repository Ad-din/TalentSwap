const mongoose = require('mongoose');
const { Schema } = mongoose;

const assessmentAttemptSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },

    score: { type: Number, required: true }, // percentage, 0-100
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    passed: { type: Boolean, required: true },

    attemptDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
