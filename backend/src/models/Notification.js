const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'swap_request',
        'swap_response',
        'session_scheduled',
        'session_reminder',
        'session_cancelled',
        'no_show_report',
        'review_received',
        'credit_transaction',
        'achievement_unlocked',
        'admin_message',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // relative frontend route, e.g. /matches/:id
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
