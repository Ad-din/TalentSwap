const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Immutable append-only ledger entry. Application code must never update or
 * delete a document in this collection - a mistake is corrected with a
 * compensating entry, not a mutation. balanceAfter is captured at write time
 * so history remains a verifiable audit trail even if logic changes later.
 */
const creditTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', default: null },

    type: {
      type: String,
      enum: ['teaching_reward', 'learning_cost', 'signup_bonus', 'admin_adjustment'],
      required: true,
    },

    amount: { type: Number, required: true }, // positive = credit, negative = debit
    balanceAfter: { type: Number, required: true, min: 0 },

    description: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

creditTransactionSchema.pre('findOneAndUpdate', function blockMutation() {
  throw new Error('CreditTransaction records are immutable and cannot be updated.');
});

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
