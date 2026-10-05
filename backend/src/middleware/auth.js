const initFirebase = require('../config/firebase');
const User = require('../models/User');

/**
 * Verifies the Firebase ID token in the Authorization header, then loads the
 * corresponding MongoDB user document (matched by firebaseUid) and attaches
 * it to req.user. Does NOT auto-create the Mongo user here - that happens
 * explicitly during the registration/onboarding flow so we control what
 * profile data is required up front.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const admin = initFirebase();
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      return res.status(404).json({ error: 'No SkillSwap profile found for this account. Complete registration first.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }
    if (user.status === 'deleted') {
      return res.status(403).json({ error: 'This account no longer exists.' });
    }

    req.firebaseDecodedToken = decoded;
    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

/**
 * Like requireAuth, but does not fail if there's no Mongo user yet - used
 * only on the registration endpoint where the Mongo profile is being created.
 */
async function requireFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }
    const admin = initFirebase();
    req.firebaseDecodedToken = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

module.exports = { requireAuth, requireFirebaseToken };
