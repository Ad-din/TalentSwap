const mongoose = require('mongoose');
const { Schema } = mongoose;

const swapRequestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // What the requester offers to teach and what they want to learn from the recipient.
    offeredSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    requestedSkill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },

    message: { type: String, default: '', maxlength: 1000 },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },

    matchScore: { type: Number, default: null }, // snapshot of compatibility % at request time
    matchBreakdown: { type: Schema.Types.Mixed, default: null },

    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

swapRequestSchema.pre('validate', function guardSelfRequest(next) {
  if (this.requester && this.recipient && String(this.requester) === String(this.recipient)) {
    return next(new Error('A user cannot send a swap request to themselves.'));
  }
  next();
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
