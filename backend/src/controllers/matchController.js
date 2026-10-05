const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const { computeMatch } = require('../services/matchingService');
const { findExchangeCycles } = require('../services/cycleDetectionService');

async function getSkillSets(userId) {
  const entries = await UserSkill.find({ user: userId }).populate('skill');
  return {
    teach: entries.filter((e) => e.type === 'teach').map((e) => e.skill),
    learn: entries.filter((e) => e.type === 'learn').map((e) => e.skill),
  };
}

/**
 * Returns ranked, explainable matches for the current user against every
 * other active user who has at least one overlapping teach/learn interest.
 */
async function getMatches(req, res, next) {
  try {
    const me = req.user;
    const mySkills = await getSkillSets(me._id);

    if (mySkills.teach.length === 0 && mySkills.learn.length === 0) {
      return res.json({ matches: [], note: 'Add skills you can teach or want to learn to see matches.' });
    }

    const candidates = await User.find({ _id: { $ne: me._id }, status: 'active' });

    const results = [];
    for (const candidate of candidates) {
      const candidateSkills = await getSkillSets(candidate._id);
      if (candidateSkills.teach.length === 0 && candidateSkills.learn.length === 0) continue;

      const match = computeMatch({
        userA: me,
        userB: candidate,
        userATeachSkills: mySkills.teach,
        userALearnSkills: mySkills.learn,
        userBTeachSkills: candidateSkills.teach,
        userBLearnSkills: candidateSkills.learn,
      });

      if (match.totalScore > 0) {
        results.push({
          user: {
            _id: candidate._id,
            displayName: candidate.displayName,
            photoURL: candidate.photoURL,
            location: candidate.location,
            reputation: candidate.reputation,
          },
          ...match,
        });
      }
    }

    results.sort((a, b) => b.totalScore - a.totalScore);
    res.json({ matches: results });
  } catch (err) {
    next(err);
  }
}

async function getMatchExplanation(req, res, next) {
  try {
    const me = req.user;
    const other = await User.findById(req.params.userId);
    if (!other) return res.status(404).json({ error: 'User not found' });

    const [mySkills, otherSkills] = await Promise.all([
      getSkillSets(me._id),
      getSkillSets(other._id),
    ]);

    const match = computeMatch({
      userA: me,
      userB: other,
      userATeachSkills: mySkills.teach,
      userALearnSkills: mySkills.learn,
      userBTeachSkills: otherSkills.teach,
      userBLearnSkills: otherSkills.learn,
    });

    res.json({ match });
  } catch (err) {
    next(err);
  }
}

/**
 * Advanced recommendation: detects multi-person exchange cycles (A->B->C->A)
 * among the current user's broader candidate pool. Presented as suggestions
 * only - no automatic multi-party transactions.
 */
async function getExchangeCycles(req, res, next) {
  try {
    const users = await User.find({ status: 'active' }).limit(200); // bounded for MVP
    const skillSetsByUser = new Map();
    for (const u of users) {
      const entries = await UserSkill.find({ user: u._id });
      skillSetsByUser.set(String(u._id), {
        teach: new Set(entries.filter((e) => e.type === 'teach').map((e) => String(e.skill))),
        learn: new Set(entries.filter((e) => e.type === 'learn').map((e) => String(e.skill))),
      });
    }

    const nodes = users.map((u) => ({
      userId: String(u._id),
      teachSkillIds: skillSetsByUser.get(String(u._id)).teach,
      learnSkillIds: skillSetsByUser.get(String(u._id)).learn,
    }));

    // Exact-skill-id compatibility for cycle detection (keeps the graph
    // search fast and the cycles easy to explain to users).
    const isCompatible = (teachId, learnId) => teachId === learnId;

    const cycles = findExchangeCycles(nodes, isCompatible);
    const myCycles = cycles.filter((c) => c.includes(String(req.user._id)));

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const explained = myCycles.map((cycle) => cycle.map((id) => ({
      _id: id,
      displayName: userMap.get(id)?.displayName,
    })));

    res.json({ cycles: explained });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMatches, getMatchExplanation, getExchangeCycles };
