const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSkillSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },

    // "teach" = user can teach this skill, "learn" = user wants to learn it
    type: { type: String, enum: ['teach', 'learn'], required: true },

    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },

    yearsExperience: { type: Number, default: 0, min: 0 },

    isVerified: { type: Boolean, default: false }, // set true only via passed Assessment
    verifiedLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert', null],
      default: null,
    },
  },
  { timestamps: true }
);

// A user can't list the same skill twice with the same intent (teach/learn).
userSkillSchema.index({ user: 1, skill: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('UserSkill', userSkillSchema);
