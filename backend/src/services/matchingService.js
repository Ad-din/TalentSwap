const appConfig = require('../config/appConfig');
const { distanceKm } = require('../utils/geo');
const { computeOverlapMinutes, MINUTES_PER_WEEK } = require('../utils/availability');

const { weights, skillScores, locationThresholdsKm, locationScoreBeyondMax } = appConfig.matching;

/**
 * All scoring functions below are deterministic and rule-based - no LLM in
 * the loop - so the compatibility % is explainable and reproducible.
 */

// ---------------------------------------------------------------------------
// 1. Skill compatibility (40%)
// ---------------------------------------------------------------------------

/**
 * Scores how compatible skillA (offered) is with skillB (wanted), using the
 * taxonomy: exact match > explicit related-skill edge > same subcategory >
 * same category > unrelated.
 * Expects populated Skill documents (relatedSkills as ObjectIds is enough).
 */
function scoreSkillPair(skillA, skillB) {
  if (!skillA || !skillB) return { score: 0, reason: 'One or both skills missing' };

  if (String(skillA._id) === String(skillB._id)) {
    return { score: skillScores.exact, reason: `Exact match on ${skillA.name}` };
  }

  const aRelatedIds = (skillA.relatedSkills || []).map(String);
  const bRelatedIds = (skillB.relatedSkills || []).map(String);
  const isRelated = aRelatedIds.includes(String(skillB._id)) || bRelatedIds.includes(String(skillA._id));
  if (isRelated) {
    return { score: skillScores.related, reason: `${skillA.name} is closely related to ${skillB.name}` };
  }

  if (skillA.subcategory && skillA.subcategory === skillB.subcategory) {
    return { score: skillScores.subcategory, reason: `Both in "${skillA.subcategory}" subcategory` };
  }

  if (skillA.category === skillB.category) {
    return { score: skillScores.category, reason: `Both in "${skillA.category}" category` };
  }

  const sharedTags = (skillA.tags || []).filter((t) => (skillB.tags || []).includes(t));
  if (sharedTags.length > 0) {
    return { score: skillScores.category, reason: `Shared tags: ${sharedTags.join(', ')}` };
  }

  return { score: skillScores.unrelated, reason: 'No taxonomy relationship found' };
}

/**
 * Two-way skill compatibility: how well what userA teaches maps to what
 * userB wants to learn, and vice versa. Mutual (two-way) exchange is
 * rewarded per spec rule #12.
 */
function scoreMutualSkillCompatibility(userATeach, userALearn, userBTeach, userBLearn) {
  let bestAtoB = { score: 0, reason: 'No match found' };
  for (const t of userATeach) {
    for (const l of userBLearn) {
      const result = scoreSkillPair(t, l);
      if (result.score > bestAtoB.score) bestAtoB = result;
    }
  }

  let bestBtoA = { score: 0, reason: 'No match found' };
  for (const t of userBTeach) {
    for (const l of userALearn) {
      const result = scoreSkillPair(t, l);
      if (result.score > bestBtoA.score) bestBtoA = result;
    }
  }

  const isMutual = bestAtoB.score > 0 && bestBtoA.score > 0;
  // Mutual exchange averages both directions; one-directional is capped at
  // 70% of the one-way score so two-way matches consistently outrank them.
  const score = isMutual
    ? (bestAtoB.score + bestBtoA.score) / 2
    : Math.max(bestAtoB.score, bestBtoA.score) * 0.7;

  return {
    score: Math.round(score),
    isMutual,
    aTeachesB: bestAtoB,
    bTeachesA: bestBtoA,
  };
}

// ---------------------------------------------------------------------------
// 2. Availability (20%)
// ---------------------------------------------------------------------------

function scoreAvailability(userASlots, userBSlots) {
  const overlapMinutes = computeOverlapMinutes(userASlots, userBSlots);
  const overlapHours = overlapMinutes / 60;

  // Score scales with overlap, saturating at 5+ hours/week of shared availability.
  const SATURATION_HOURS = 5;
  const score = Math.min(100, Math.round((overlapHours / SATURATION_HOURS) * 100));

  return { score, overlapHours: Math.round(overlapHours * 10) / 10 };
}

// ---------------------------------------------------------------------------
// 3. Location (15%)
// ---------------------------------------------------------------------------

function scoreLocation(userA, userB) {
  if (userA?.location?.prefersOnlineOnly || userB?.location?.prefersOnlineOnly) {
    return { score: 90, distanceKm: null, reason: 'Online session preferred' };
  }

  const coordsA = userA?.location?.geo?.coordinates;
  const coordsB = userB?.location?.geo?.coordinates;
  if (!coordsA || !coordsB || coordsA.length !== 2 || coordsB.length !== 2) {
    return { score: 50, distanceKm: null, reason: 'Location not set for one or both users' };
  }

  const km = distanceKm(coordsA, coordsB);
  for (const tier of locationThresholdsKm) {
    if (km < tier.maxKm) {
      return { score: tier.score, distanceKm: Math.round(km * 10) / 10 };
    }
  }
  return { score: locationScoreBeyondMax, distanceKm: Math.round(km * 10) / 10 };
}

// ---------------------------------------------------------------------------
// 4. Experience level (15%)
// ---------------------------------------------------------------------------

const EXPERIENCE_RANK = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

function scoreExperience(levelA, levelB) {
  const rankA = EXPERIENCE_RANK[levelA] ?? 0;
  const rankB = EXPERIENCE_RANK[levelB] ?? 0;
  const gap = Math.abs(rankA - rankB);
  // 0 gap = 100, 1 = 75, 2 = 50, 3 = 25 - a teacher should outrank the
  // learner or be close, but we don't require an exact match.
  const score = Math.max(0, 100 - gap * 25);
  return { score, gap };
}

// ---------------------------------------------------------------------------
// 5. Reputation (10%)
// ---------------------------------------------------------------------------

function scoreReputation(user) {
  const { averageRating = 0, totalReviews = 0 } = user?.reputation || {};
  if (totalReviews === 0) return { score: 60, reason: 'No reviews yet' }; // neutral default
  const score = Math.round((averageRating / 5) * 100);
  return { score, reason: `${averageRating.toFixed(1)}/5 over ${totalReviews} reviews` };
}

// ---------------------------------------------------------------------------
// Combined, explainable match result
// ---------------------------------------------------------------------------

/**
 * Computes the full explainable compatibility score between two users for a
 * potential skill exchange.
 *
 * @param {Object} params
 * @param {Object} params.userA - populated User document
 * @param {Object} params.userB - populated User document
 * @param {Object[]} params.userATeachSkills - Skill docs userA can teach
 * @param {Object[]} params.userALearnSkills - Skill docs userA wants to learn
 * @param {Object[]} params.userBTeachSkills - Skill docs userB can teach
 * @param {Object[]} params.userBLearnSkills - Skill docs userB wants to learn
 */
function computeMatch({
  userA,
  userB,
  userATeachSkills,
  userALearnSkills,
  userBTeachSkills,
  userBLearnSkills,
}) {
  const skill = scoreMutualSkillCompatibility(
    userATeachSkills,
    userALearnSkills,
    userBTeachSkills,
    userBLearnSkills
  );
  const availability = scoreAvailability(userA.availability, userB.availability);
  const location = scoreLocation(userA, userB);
  const experience = scoreExperience(userA.experienceLevel, userB.experienceLevel);
  const reputationB = scoreReputation(userB); // reputation of the person being matched to

  const weighted = {
    skill: (skill.score * weights.skill) / 100,
    availability: (availability.score * weights.availability) / 100,
    location: (location.score * weights.location) / 100,
    experience: (experience.score * weights.experience) / 100,
    reputation: (reputationB.score * weights.reputation) / 100,
  };

  const total = Math.round(
    weighted.skill + weighted.availability + weighted.location + weighted.experience + weighted.reputation
  );

  const highlights = [];
  if (skill.isMutual) highlights.push('Strong two-way skill match');
  else if (skill.score >= skillScores.related) highlights.push('Related skill match found');
  if (availability.overlapHours > 0) {
    highlights.push(`${availability.overlapHours} hours of weekly availability overlap`);
  }
  if (location.distanceKm != null) highlights.push(`${location.distanceKm} km apart`);
  else if (location.reason === 'Online session preferred') highlights.push('Both open to online sessions');
  if (experience.gap <= 1) highlights.push('Experience levels are compatible');
  if (reputationB.score >= 80) highlights.push('Highly rated');

  return {
    totalScore: Math.max(0, Math.min(100, total)),
    highlights,
    breakdown: {
      skill: { raw: skill.score, weighted: Math.round(weighted.skill), max: weights.skill, detail: skill },
      availability: {
        raw: availability.score,
        weighted: Math.round(weighted.availability),
        max: weights.availability,
        detail: availability,
      },
      location: {
        raw: location.score,
        weighted: Math.round(weighted.location),
        max: weights.location,
        detail: location,
      },
      experience: {
        raw: experience.score,
        weighted: Math.round(weighted.experience),
        max: weights.experience,
        detail: experience,
      },
      reputation: {
        raw: reputationB.score,
        weighted: Math.round(weighted.reputation),
        max: weights.reputation,
        detail: reputationB,
      },
    },
  };
}

module.exports = {
  scoreSkillPair,
  scoreMutualSkillCompatibility,
  scoreAvailability,
  scoreLocation,
  scoreExperience,
  scoreReputation,
  computeMatch,
};
