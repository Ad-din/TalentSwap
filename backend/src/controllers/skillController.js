const Skill = require('../models/Skill');
const slugify = require('../utils/slugify');

async function listSkills(req, res, next) {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skills = await Skill.find(filter).sort({ category: 1, name: 1 });
    res.json({ skills });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const categories = await Skill.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

// --- Admin only below ---

async function createSkill(req, res, next) {
  try {
    const { name, category, subcategory, description, tags, relatedSkills } = req.body;
    const skill = await Skill.create({
      name,
      slug: slugify(name),
      category,
      subcategory,
      description,
      tags,
      relatedSkills,
    });
    res.status(201).json({ skill });
  } catch (err) {
    next(err);
  }
}

async function updateSkill(req, res, next) {
  try {
    const update = { ...req.body };
    if (update.name) update.slug = slugify(update.name);
    const skill = await Skill.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json({ skill });
  } catch (err) {
    next(err);
  }
}

async function deleteSkill(req, res, next) {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json({ skill });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSkills, listCategories, createSkill, updateSkill, deleteSkill };
