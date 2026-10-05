require('dotenv').config();
const connectDB = require('../config/db');
const Skill = require('../models/Skill');
const SKILL_TAXONOMY = require('./skillTaxonomy');
const slugify = require('../utils/slugify');

async function seedSkills() {
  console.log(`[seed] Seeding ${SKILL_TAXONOMY.length} skills...`);

  // Pass 1: upsert every skill without relatedSkills (need all _ids first).
  const nameToId = new Map();
  for (const entry of SKILL_TAXONOMY) {
    const doc = await Skill.findOneAndUpdate(
      { name: entry.name },
      {
        name: entry.name,
        slug: slugify(entry.name),
        category: entry.category,
        subcategory: entry.subcategory || '',
        tags: entry.tags || [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    nameToId.set(entry.name, doc._id);
  }

  // Pass 2: resolve related-skill names to ObjectIds and save.
  for (const entry of SKILL_TAXONOMY) {
    const relatedIds = (entry.related || [])
      .map((name) => nameToId.get(name))
      .filter(Boolean);
    await Skill.findByIdAndUpdate(nameToId.get(entry.name), { relatedSkills: relatedIds });
  }

  console.log('[seed] Skill taxonomy seeded successfully.');
}

async function run() {
  await connectDB();
  await seedSkills();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
