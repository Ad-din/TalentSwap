const User = require('../models/User');
const { toApproximateCoordinates } = require('../utils/geo');

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id || req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { displayName, bio, experienceLevel, photoURL, onboardingComplete } = req.body;
    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (experienceLevel !== undefined) update.experienceLevel = experienceLevel;
    if (photoURL !== undefined) update.photoURL = photoURL;
    if (onboardingComplete !== undefined) update.onboardingComplete = onboardingComplete;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Replaces the full weekly availability slot list for the current user.
 */
async function updateAvailability(req, res, next) {
  try {
    const { slots } = req.body; // [{ dayOfWeek, startTime, endTime, timezone }]
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'slots must be an array' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { availability: slots },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Stores an approximate location only - coordinates are rounded server-side
 * so an exact residential address is never persisted, regardless of what
 * precision the client sends.
 */
async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude, city, area, prefersOnlineOnly } = req.body;

    const existing = await User.findById(req.user._id).select('location');
    const merged = { ...(existing.location?.toObject?.() || existing.location || {}) };

    if (latitude != null && longitude != null) {
      const [lng, lat] = toApproximateCoordinates(Number(longitude), Number(latitude));
      merged.geo = { type: 'Point', coordinates: [lng, lat] };
    }
    if (city !== undefined) merged.city = city;
    if (area !== undefined) merged.area = area;
    if (prefersOnlineOnly !== undefined) merged.prefersOnlineOnly = prefersOnlineOnly;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { location: merged } },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, updateAvailability, updateLocation };
