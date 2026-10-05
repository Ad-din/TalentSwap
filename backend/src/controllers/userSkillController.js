const UserSkill = require('../models/UserSkill');

async function listMySkills(req, res, next) {
  try {
    const skills = await UserSkill.find({ user: req.user._id }).populate('skill');
    res.json({
      teach: skills.filter((s) => s.type === 'teach'),
      learn: skills.filter((s) => s.type === 'learn'),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Public view of another user's teach/learn skill list - needed so one user
 * can see what a match offers before sending a swap request.
 */
async function listSkillsForUser(req, res, next) {
  try {
    const skills = await UserSkill.find({ user: req.params.userId }).populate('skill');
    res.json({
      teach: skills.filter((s) => s.type === 'teach'),
      learn: skills.filter((s) => s.type === 'learn'),
    });
  } catch (err) {
    next(err);
  }
}

async function addUserSkill(req, res, next) {
  try {
    const { skillId, type, proficiencyLevel, yearsExperience } = req.body;
    if (!['teach', 'learn'].includes(type)) {
      return res.status(400).json({ error: 'type must be "teach" or "learn"' });
    }

    const userSkill = await UserSkill.create({
      user: req.user._id,
      skill: skillId,
      type,
      proficiencyLevel,
      yearsExperience,
    });
    await userSkill.populate('skill');
    res.status(201).json({ userSkill });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This skill is already in your list for that category (teach/learn)' });
    }
    next(err);
  }
}

async function removeUserSkill(req, res, next) {
  try {
    const userSkill = await UserSkill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!userSkill) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMySkills, addUserSkill, removeUserSkill, listSkillsForUser };
