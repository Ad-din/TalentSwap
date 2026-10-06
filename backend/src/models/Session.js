const mongoose = require('mongoose');
const { Schema } = mongoose;

const noShowReportSchema = new Schema(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '', maxlength: 500 },
    adminReviewed: { type: Boolean, default: false },
    adminDecision: {
      type: String,
      enum: ['upheld', 'dismissed', null],
      default: null,
    },
  },
  { _id: false }
);

const sessionSchema = new Schema(
  {
    swapRequest: { type: Schema.Types.ObjectId, ref: 'SwapRequest', required: true, index: true },

    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },

    // Stored in UTC; convert to each participant's timezone at the presentation layer.
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },

    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true,
    },

    location: {
      isOnline: { type: Boolean, default: true },
      meetingLink: { type: String, default: '' },
      address: { type: String, default: '' },
    },

    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancellationReason: { type: String, default: '' },

    noShowReport: { type: noShowReportSchema, default: null },

    // Set once, when status transitions to 'completed'. Drives credit transfer.
    completedAt: { type: Date, default: null },
    creditsSettled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

sessionSchema.index({ teacher: 1, startTime: 1 });
sessionSchema.index({ learner: 1, startTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
