const mongoose = require('mongoose');
const { Schema } = mongoose;

const goalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    targetSkill: { type: Schema.Types.ObjectId, ref: 'Skill', default: null },
    description: { type: String, default: '' },

    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
      index: true,
    },

    // Optional link to an AI-generated roadmap that fulfills this goal.
    roadmap: { type: Schema.Types.ObjectId, ref: 'Roadmap', default: null },

    targetDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', goalSchema);
