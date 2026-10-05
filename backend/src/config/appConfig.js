/**
 * Centralized, environment-driven configuration for tunable business rules.
 * Nothing in services/ should hardcode these numbers directly - they should
 * import this file so values can change without touching logic.
 */

const num = (val, fallback) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

const appConfig = {
  credits: {
    startingBalance: num(process.env.CREDIT_STARTING_BALANCE, 50),
    ratePerTeachingHour: num(process.env.CREDIT_RATE_PER_TEACHING_HOUR, 10),
    ratePerLearningHour: num(process.env.CREDIT_RATE_PER_LEARNING_HOUR, 10),
    minBalance: num(process.env.CREDIT_MIN_BALANCE, 0),
  },

  matching: {
    weights: {
      skill: num(process.env.MATCH_WEIGHT_SKILL, 40),
      availability: num(process.env.MATCH_WEIGHT_AVAILABILITY, 20),
      location: num(process.env.MATCH_WEIGHT_LOCATION, 15),
      experience: num(process.env.MATCH_WEIGHT_EXPERIENCE, 15),
      reputation: num(process.env.MATCH_WEIGHT_REPUTATION, 10),
    },
    skillScores: {
      exact: num(process.env.SKILL_SCORE_EXACT, 100),
      related: num(process.env.SKILL_SCORE_RELATED, 80),
      subcategory: num(process.env.SKILL_SCORE_SUBCATEGORY, 60),
      category: num(process.env.SKILL_SCORE_CATEGORY, 40),
      unrelated: num(process.env.SKILL_SCORE_UNRELATED, 0),
    },
    locationThresholdsKm: [
      { maxKm: 2, score: num(process.env.LOCATION_SCORE_UNDER_2KM, 100) },
      { maxKm: 5, score: num(process.env.LOCATION_SCORE_UNDER_5KM, 80) },
      { maxKm: 10, score: num(process.env.LOCATION_SCORE_UNDER_10KM, 60) },
      { maxKm: 20, score: num(process.env.LOCATION_SCORE_UNDER_20KM, 40) },
    ],
    locationScoreBeyondMax: num(process.env.LOCATION_SCORE_OVER_20KM, 20),
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    mockFallback: (process.env.AI_MOCK_FALLBACK || 'true') === 'true',
  },

  // Coordinates are rounded to this many decimal places before storage so we
  // never persist an exact residential address (~0.01 deg ~= 1.1km at the
  // equator; tune PRECISION_DECIMALS to trade off privacy vs match accuracy).
  location: {
    coordinatePrecisionDecimals: num(process.env.LOCATION_COORD_PRECISION, 3),
  },
};

module.exports = appConfig;
