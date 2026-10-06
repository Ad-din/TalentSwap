/**
 * Starter skill taxonomy. Each skill lists its category/subcategory/tags and
 * the *names* of strongly-related skills (resolved to ObjectIds in index.js
 * after all skills are created, since Mongo needs real _ids for the edges).
 * Expand this list as needed - it's intentionally not exhaustive.
 */
const SKILL_TAXONOMY = [
  // --- Web Development ---
  { name: 'JavaScript', category: 'Web Development', subcategory: 'Programming Languages', tags: ['frontend', 'backend'], related: ['TypeScript', 'React', 'Node.js'] },
  { name: 'TypeScript', category: 'Web Development', subcategory: 'Programming Languages', tags: ['frontend', 'backend'], related: ['JavaScript', 'React', 'Node.js'] },
  { name: 'React', category: 'Web Development', subcategory: 'Frontend Frameworks', tags: ['frontend', 'ui'], related: ['JavaScript', 'Next.js', 'Redux'] },
  { name: 'Next.js', category: 'Web Development', subcategory: 'Frontend Frameworks', tags: ['frontend', 'ssr'], related: ['React', 'JavaScript', 'Node.js'] },
  { name: 'Vue.js', category: 'Web Development', subcategory: 'Frontend Frameworks', tags: ['frontend', 'ui'], related: ['JavaScript'] },
  { name: 'Angular', category: 'Web Development', subcategory: 'Frontend Frameworks', tags: ['frontend', 'ui'], related: ['TypeScript'] },
  { name: 'Redux', category: 'Web Development', subcategory: 'Frontend Frameworks', tags: ['frontend', 'state-management'], related: ['React'] },
  { name: 'Tailwind CSS', category: 'Web Development', subcategory: 'Styling', tags: ['css', 'frontend'], related: ['CSS'] },
  { name: 'CSS', category: 'Web Development', subcategory: 'Styling', tags: ['css', 'frontend'], related: ['Tailwind CSS', 'Sass'] },
  { name: 'Sass', category: 'Web Development', subcategory: 'Styling', tags: ['css', 'frontend'], related: ['CSS'] },
  { name: 'Node.js', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['JavaScript', 'Express.js', 'TypeScript'] },
  { name: 'Express.js', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend', 'api'], related: ['Node.js', 'REST APIs'] },
  { name: 'Django', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['Python', 'REST APIs'] },
  { name: 'Flask', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['Python', 'REST APIs'] },
  { name: 'Ruby on Rails', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['Ruby'] },
  { name: 'PHP', category: 'Web Development', subcategory: 'Programming Languages', tags: ['backend'], related: ['Laravel', 'MySQL'] },
  { name: 'Laravel', category: 'Web Development', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['PHP', 'MySQL'] },
  { name: 'REST APIs', category: 'Web Development', subcategory: 'Backend Concepts', tags: ['backend', 'api'], related: ['Express.js', 'Node.js'] },
  { name: 'GraphQL', category: 'Web Development', subcategory: 'Backend Concepts', tags: ['backend', 'api'], related: ['REST APIs'] },
  { name: 'Authentication & Security', category: 'Web Development', subcategory: 'Backend Concepts', tags: ['backend', 'security'], related: ['REST APIs'] },

  // --- Databases ---
  { name: 'MongoDB', category: 'Databases', subcategory: 'NoSQL', tags: ['database', 'backend'], related: ['Mongoose', 'Node.js'] },
  { name: 'Mongoose', category: 'Databases', subcategory: 'NoSQL', tags: ['database', 'backend'], related: ['MongoDB'] },
  { name: 'MySQL', category: 'Databases', subcategory: 'SQL', tags: ['database'], related: ['PostgreSQL', 'PHP'] },
  { name: 'PostgreSQL', category: 'Databases', subcategory: 'SQL', tags: ['database'], related: ['MySQL'] },
  { name: 'Redis', category: 'Databases', subcategory: 'NoSQL', tags: ['database', 'caching'], related: [] },

  // --- Programming Languages (general) ---
  { name: 'Python', category: 'Programming Languages', subcategory: 'General Purpose', tags: ['backend', 'data'], related: ['Django', 'Flask', 'Data Analysis'] },
  { name: 'Java', category: 'Programming Languages', subcategory: 'General Purpose', tags: ['backend'], related: ['Spring Boot'] },
  { name: 'Spring Boot', category: 'Programming Languages', subcategory: 'Backend Frameworks', tags: ['backend'], related: ['Java'] },
  { name: 'C++', category: 'Programming Languages', subcategory: 'Systems', tags: ['systems'], related: ['C'] },
  { name: 'C', category: 'Programming Languages', subcategory: 'Systems', tags: ['systems'], related: ['C++'] },
  { name: 'Go', category: 'Programming Languages', subcategory: 'Systems', tags: ['backend', 'systems'], related: [] },
  { name: 'Ruby', category: 'Programming Languages', subcategory: 'General Purpose', tags: ['backend'], related: ['Ruby on Rails'] },

  // --- Mobile Development ---
  { name: 'React Native', category: 'Mobile Development', subcategory: 'Cross-Platform', tags: ['mobile'], related: ['React', 'JavaScript'] },
  { name: 'Flutter', category: 'Mobile Development', subcategory: 'Cross-Platform', tags: ['mobile'], related: ['Dart'] },
  { name: 'Dart', category: 'Mobile Development', subcategory: 'Programming Languages', tags: ['mobile'], related: ['Flutter'] },
  { name: 'Swift', category: 'Mobile Development', subcategory: 'iOS', tags: ['mobile', 'ios'], related: [] },
  { name: 'Kotlin', category: 'Mobile Development', subcategory: 'Android', tags: ['mobile', 'android'], related: ['Java'] },

  // --- Data & AI ---
  { name: 'Data Analysis', category: 'Data & AI', subcategory: 'Data Science', tags: ['data'], related: ['Python', 'Machine Learning'] },
  { name: 'Machine Learning', category: 'Data & AI', subcategory: 'AI/ML', tags: ['data', 'ai'], related: ['Python', 'Deep Learning', 'Data Analysis'] },
  { name: 'Deep Learning', category: 'Data & AI', subcategory: 'AI/ML', tags: ['data', 'ai'], related: ['Machine Learning'] },
  { name: 'Data Visualization', category: 'Data & AI', subcategory: 'Data Science', tags: ['data'], related: ['Data Analysis'] },
  { name: 'SQL for Analytics', category: 'Data & AI', subcategory: 'Data Science', tags: ['data'], related: ['MySQL', 'PostgreSQL'] },

  // --- Design ---
  { name: 'UI/UX Design', category: 'Design', subcategory: 'Product Design', tags: ['design'], related: ['Figma', 'Graphic Design'] },
  { name: 'Figma', category: 'Design', subcategory: 'Design Tools', tags: ['design', 'tools'], related: ['UI/UX Design'] },
  { name: 'Graphic Design', category: 'Design', subcategory: 'Visual Design', tags: ['design'], related: ['UI/UX Design', 'Photoshop'] },
  { name: 'Photoshop', category: 'Design', subcategory: 'Design Tools', tags: ['design', 'tools'], related: ['Graphic Design', 'Illustrator'] },
  { name: 'Illustrator', category: 'Design', subcategory: 'Design Tools', tags: ['design', 'tools'], related: ['Photoshop'] },
  { name: 'Motion Graphics', category: 'Design', subcategory: 'Visual Design', tags: ['design', 'video'], related: ['After Effects'] },
  { name: 'After Effects', category: 'Design', subcategory: 'Design Tools', tags: ['design', 'video', 'tools'], related: ['Motion Graphics'] },

  // --- Media & Creative ---
  { name: 'Photography', category: 'Media & Creative', subcategory: 'Visual Media', tags: ['creative'], related: ['Photo Editing'] },
  { name: 'Photo Editing', category: 'Media & Creative', subcategory: 'Visual Media', tags: ['creative'], related: ['Photography', 'Photoshop'] },
  { name: 'Video Editing', category: 'Media & Creative', subcategory: 'Video', tags: ['creative', 'video'], related: ['After Effects'] },
  { name: 'Music Production', category: 'Media & Creative', subcategory: 'Audio', tags: ['creative', 'music'], related: [] },
  { name: 'Creative Writing', category: 'Media & Creative', subcategory: 'Writing', tags: ['creative', 'writing'], related: ['Copywriting'] },
  { name: 'Copywriting', category: 'Media & Creative', subcategory: 'Writing', tags: ['creative', 'writing', 'marketing'], related: ['Creative Writing'] },

  // --- Business & Marketing ---
  { name: 'Digital Marketing', category: 'Business & Marketing', subcategory: 'Marketing', tags: ['marketing'], related: ['SEO', 'Copywriting'] },
  { name: 'SEO', category: 'Business & Marketing', subcategory: 'Marketing', tags: ['marketing'], related: ['Digital Marketing'] },
  { name: 'Project Management', category: 'Business & Marketing', subcategory: 'Management', tags: ['business'], related: ['Agile/Scrum'] },
  { name: 'Agile/Scrum', category: 'Business & Marketing', subcategory: 'Management', tags: ['business'], related: ['Project Management'] },
  { name: 'Public Speaking', category: 'Business & Marketing', subcategory: 'Soft Skills', tags: ['communication'], related: [] },
  { name: 'Excel', category: 'Business & Marketing', subcategory: 'Productivity Tools', tags: ['business', 'data'], related: ['Data Analysis'] },

  // --- Languages ---
  { name: 'English', category: 'Languages', subcategory: 'Spoken Languages', tags: ['language'], related: [] },
  { name: 'Spanish', category: 'Languages', subcategory: 'Spoken Languages', tags: ['language'], related: [] },
  { name: 'Japanese', category: 'Languages', subcategory: 'Spoken Languages', tags: ['language'], related: [] },
  { name: 'Mandarin', category: 'Languages', subcategory: 'Spoken Languages', tags: ['language'], related: [] },

  // --- Music & Performing Arts ---
  { name: 'Guitar', category: 'Music & Performing Arts', subcategory: 'Instruments', tags: ['music'], related: [] },
  { name: 'Piano', category: 'Music & Performing Arts', subcategory: 'Instruments', tags: ['music'], related: [] },
  { name: 'Singing', category: 'Music & Performing Arts', subcategory: 'Vocal', tags: ['music'], related: [] },

  // --- Fitness & Wellness ---
  { name: 'Yoga', category: 'Fitness & Wellness', subcategory: 'Mind-Body', tags: ['fitness'], related: [] },
  { name: 'Personal Training', category: 'Fitness & Wellness', subcategory: 'Fitness Coaching', tags: ['fitness'], related: ['Nutrition Coaching'] },
  { name: 'Nutrition Coaching', category: 'Fitness & Wellness', subcategory: 'Wellness', tags: ['fitness', 'health'], related: ['Personal Training'] },

  // --- Culinary ---
  { name: 'Cooking', category: 'Culinary', subcategory: 'General Cooking', tags: ['culinary'], related: ['Baking'] },
  { name: 'Baking', category: 'Culinary', subcategory: 'Baking & Pastry', tags: ['culinary'], related: ['Cooking'] },
];

module.exports = SKILL_TAXONOMY;
