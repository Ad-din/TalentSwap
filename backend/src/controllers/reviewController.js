const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { notify } = require('../services/notificationService');

/**
 * Recomputes a user's reputation from scratch across all their reviews
 * rather than incrementally averaging in the new rating. Slightly more
 * work per review, but avoids any drift between the stored average and
 * what the Review collection actually contains.
 */
async function recomputeReputation(userId) {
  const stats = await Review.aggregate([
    { $match: { reviewee: userId } },
    { $group: { _id: '$reviewee', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await User.findByIdAndUpdate(userId, {
    'reputation.averageRating': Math.round(avg * 10) / 10,
    'reputation.totalReviews': count,
  });
}

async function createReview(req, res, next) {
  try {
    const { sessionId, rating, comment } = req.body;
    if (!(rating >= 1 && rating <= 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5.' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review a session after it is completed.' });
    }

    const reviewerId = String(req.user._id);
    const isTeacher = String(session.teacher) === reviewerId;
    const isLearner = String(session.learner) === reviewerId;
    if (!isTeacher && !isLearner) {
      return res.status(403).json({ error: 'Only session participants can leave a review.' });
    }

    const reviewee = isTeacher ? session.learner : session.teacher;

    const review = await Review.create({
      session: sessionId,
      reviewer: req.user._id,
      reviewee,
      rating,
      comment: comment || '',
    });

    await recomputeReputation(reviewee);

    await notify({
      user: reviewee,
      type: 'review_received',
      title: `You received a ${rating}-star review`,
      link: '/profile',
    });

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You already reviewed this session.' });
    }
    next(err);
  }
}

async function listReviewsForUser(req, res, next) {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'displayName photoURL')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, listReviewsForUser };
