const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const appConfig = require('../config/appConfig');

class InsufficientCreditsError extends Error {
  constructor(message = 'Insufficient credit balance') {
    super(message);
    this.name = 'InsufficientCreditsError';
    this.statusCode = 400;
  }
}

/**
 * Applies a signed credit delta atomically at the database level: a debit
 * (`amount < 0`) can only succeed if the user's current balance already
 * covers it, enforced via the query filter rather than a read-then-write
 * check, which avoids a race between two concurrent debits. Then records
 * an immutable transaction line with the resulting balance.
 */
async function applyCreditDelta({ userId, amount, type, session = null, description = '' }) {
  const filter = { _id: userId };
  if (amount < 0) {
    filter['credits.balance'] = { $gte: appConfig.credits.minBalance - amount };
  }

  const updatedUser = await User.findOneAndUpdate(
    filter,
    { $inc: { 'credits.balance': amount } },
    { new: true }
  );

  if (!updatedUser) {
    throw new InsufficientCreditsError(
      `Cannot apply ${amount} credits: balance would fall below minimum of ${appConfig.credits.minBalance}`
    );
  }

  await CreditTransaction.create({
    user: userId,
    session,
    type,
    amount,
    balanceAfter: updatedUser.credits.balance,
    description,
  });

  return updatedUser.credits.balance;
}

async function grantSignupBonus(userId) {
  return applyCreditDelta({
    userId,
    amount: appConfig.credits.startingBalance,
    type: 'signup_bonus',
    description: 'Welcome bonus for joining SkillSwap',
  });
}

/**
 * Called when a Session transitions to 'completed'. Credits the teacher and
 * debits the learner based on session duration. Both operations are
 * idempotent-guarded by Session.creditsSettled at the caller level.
 */
async function settleSessionCredits(sessionDoc) {
  const durationHours = (sessionDoc.endTime - sessionDoc.startTime) / (1000 * 60 * 60);

  const teachingReward = Math.round(durationHours * appConfig.credits.ratePerTeachingHour);
  const learningCost = Math.round(durationHours * appConfig.credits.ratePerLearningHour);

  // Debit the learner first - if they can't cover it, we don't want to have
  // already paid the teacher.
  await applyCreditDelta({
    userId: sessionDoc.learner,
    amount: -learningCost,
    type: 'learning_cost',
    session: sessionDoc._id,
    description: `Learning session (${durationHours.toFixed(1)}h)`,
  });

  await applyCreditDelta({
    userId: sessionDoc.teacher,
    amount: teachingReward,
    type: 'teaching_reward',
    session: sessionDoc._id,
    description: `Teaching session (${durationHours.toFixed(1)}h)`,
  });
}

async function getBalance(userId) {
  const user = await User.findById(userId).select('credits.balance');
  return user?.credits?.balance ?? 0;
}

async function getTransactionHistory(userId, { limit = 50, before = null } = {}) {
  const query = { user: userId };
  if (before) query.createdAt = { $lt: before };
  return CreditTransaction.find(query).sort({ createdAt: -1 }).limit(limit);
}

module.exports = {
  InsufficientCreditsError,
  applyCreditDelta,
  grantSignupBonus,
  settleSessionCredits,
  getBalance,
  getTransactionHistory,
};
