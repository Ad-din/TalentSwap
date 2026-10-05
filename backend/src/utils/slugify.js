/**
 * Converts a skill name into a URL/index-safe slug. Special characters are
 * spelled out BEFORE being stripped, so names that differ only by symbols
 * (e.g. "C" vs "C++") don't collapse onto the same slug and collide against
 * the Skill model's unique index.
 */
function slugify(name) {
  let str = name.trim().toLowerCase();

  str = str.replace(/\+\+/g, '-plus-plus');
  str = str.replace(/#/g, '-sharp');
  str = str.replace(/\.js\b/g, '-js');
  str = str.replace(/\.net\b/g, '-dot-net');

  return str.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = slugify;
