const mongoose = require('mongoose');
const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "HH:mm" 24h, local to `timezone`
    endTime: { type: String, required: true },
    timezone: { type: String, required: true, default: 'UTC' }, // IANA tz, e.g. "Asia/Dhaka"
  },
  { _id: true }
);

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    photoURL: { type: String, default: null },
    bio: { type: String, default: '', maxlength: 1000 },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
      index: true,
    },

    // Approximate location only - never store exact residential address.
    // Coordinates are rounded at write-time (see utils/geo.js).
    location: {
      city: { type: String, default: '' },
      area: { type: String, default: '' },
      prefersOnlineOnly: { type: Boolean, default: false },
      // Kept as its own nested field with NO defaults, so it stays entirely
      // absent from the document until a user sets real coordinates - that's
      // what lets the 2dsphere index skip users who haven't set a location,
      // instead of choking on a half-filled GeoJSON shape (a bare
      // `{ type: 'Point' }` with no coordinates is invalid GeoJSON and the
      // index rejects the whole document).
      geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat], rounded/approximate
      },
    },

    availability: { type: [availabilitySlotSchema], default: [] },

    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },

    credits: {
      balance: { type: Number, default: 0, min: 0 },
    },

    reputation: {
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
    },

    verificationBadges: [
      {
        skill: { type: Schema.Types.ObjectId, ref: 'Skill' },
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
        verifiedAt: { type: Date },
      },
    ],

    onboardingComplete: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ 'location.geo': '2dsphere' });

module.exports = mongoose.model('User', userSchema);
