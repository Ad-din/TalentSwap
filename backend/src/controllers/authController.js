const User = require('../models/User');
const creditService = require('../services/creditService');

/**
 * Called once, right after the client registers with Firebase (email/password
 * or Google). Creates the corresponding MongoDB profile and grants the
 * signup bonus. requireFirebaseToken middleware has already verified the
 * token and attached req.firebaseDecodedToken.
 */
async function register(req, res, next) {
  try {
    const { uid, email, name, picture } = req.firebaseDecodedToken;
    const { displayName } = req.body;

    const existing = await User.findOne({ firebaseUid: uid });
    if (existing) {
      return res.status(409).json({ error: 'Profile already exists for this account', user: existing });
    }

    const user = await User.create({
      firebaseUid: uid,
      email: email?.toLowerCase(),
      displayName: displayName || name || email?.split('@')[0] || 'New User',
      photoURL: picture || null,
      credits: { balance: 0 },
    });

    await creditService.grantSignupBonus(user._id);
    const refreshed = await User.findById(user._id);

    res.status(201).json({ user: refreshed });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, me };
