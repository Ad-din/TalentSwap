const mongoose = require('mongoose');
const { Schema } = mongoose;

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    subcategory: { type: String, default: '', trim: true, index: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [], index: true },

    // Explicit "strongly related" edges - deliberately curated, not inferred.
    // This is what powers the 80-point "related skill" match tier.
    relatedSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ category: 1, subcategory: 1 });

module.exports = mongoose.model('Skill', skillSchema);
