const {
  scoreSkillPair,
  scoreMutualSkillCompatibility,
  scoreAvailability,
  scoreLocation,
  scoreExperience,
} = require('../matchingService');

const mkSkill = (id, name, category, subcategory, relatedSkills = []) => ({
  _id: id,
  name,
  category,
  subcategory,
  tags: [],
  relatedSkills,
});

describe('scoreSkillPair', () => {
  const react = mkSkill('react', 'React', 'Web Development', 'Frontend Frameworks', ['nextjs']);
  const nextjs = mkSkill('nextjs', 'Next.js', 'Web Development', 'Frontend Frameworks', ['react']);
  const vue = mkSkill('vue', 'Vue.js', 'Web Development', 'Frontend Frameworks');
  const python = mkSkill('python', 'Python', 'Programming Languages', 'General Purpose');

  test('exact match scores highest', () => {
    expect(scoreSkillPair(react, react).score).toBe(100);
  });

  test('explicitly related skills score above same-subcategory', () => {
    expect(scoreSkillPair(react, nextjs).score).toBe(80);
  });

  test('same subcategory without explicit relation scores lower than related', () => {
    const result = scoreSkillPair(react, vue);
    expect(result.score).toBe(60);
  });

  test('different category scores as unrelated', () => {
    expect(scoreSkillPair(react, python).score).toBe(0);
  });
});

describe('scoreMutualSkillCompatibility', () => {
  const python = mkSkill('python', 'Python', 'Programming Languages', 'General Purpose');
  const uiux = mkSkill('uiux', 'UI/UX Design', 'Design', 'Product Design');
  const photography = mkSkill('photo', 'Photography', 'Media & Creative', 'Visual Media');

  test('mutual two-way exchange outranks one-directional match', () => {
    // A teaches Python, wants UI/UX. B teaches UI/UX, wants Python => mutual.
    const mutual = scoreMutualSkillCompatibility([python], [uiux], [uiux], [python]);
    expect(mutual.isMutual).toBe(true);

    // A teaches Python, wants UI/UX. C teaches UI/UX, wants Photography => one-way only.
    const oneWay = scoreMutualSkillCompatibility([python], [uiux], [uiux], [photography]);
    expect(oneWay.isMutual).toBe(false);

    expect(mutual.score).toBeGreaterThan(oneWay.score);
  });
});

describe('scoreAvailability', () => {
  test('fully overlapping slots score 100', () => {
    const slotsA = [{ dayOfWeek: 'saturday', startTime: '18:00', endTime: '21:00', timezone: 'UTC' }];
    const slotsB = [{ dayOfWeek: 'saturday', startTime: '18:00', endTime: '23:00', timezone: 'UTC' }];
    const result = scoreAvailability(slotsA, slotsB);
    expect(result.overlapHours).toBeCloseTo(3, 1);
    expect(result.score).toBe(60); // 3/5 hours saturation
  });

  test('no overlap scores 0', () => {
    const slotsA = [{ dayOfWeek: 'saturday', startTime: '18:00', endTime: '20:00', timezone: 'UTC' }];
    const slotsB = [{ dayOfWeek: 'sunday', startTime: '18:00', endTime: '20:00', timezone: 'UTC' }];
    expect(scoreAvailability(slotsA, slotsB).score).toBe(0);
  });
});

describe('scoreLocation', () => {
  test('close users score high', () => {
    const userA = { location: { geo: { coordinates: [90.36, 23.75] } } }; // Dhaka-ish
    const userB = { location: { geo: { coordinates: [90.37, 23.76] } } }; // ~1.5km away
    const result = scoreLocation(userA, userB);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  test('online preference overrides distance penalty', () => {
    const userA = { location: { geo: { coordinates: [90.36, 23.75] }, prefersOnlineOnly: true } };
    const userB = { location: { geo: { coordinates: [0, 0] } } };
    expect(scoreLocation(userA, userB).score).toBe(90);
  });
});

describe('scoreExperience', () => {
  test('same level scores 100', () => {
    expect(scoreExperience('intermediate', 'intermediate').score).toBe(100);
  });

  test('larger gap scores lower', () => {
    expect(scoreExperience('beginner', 'expert').score).toBeLessThan(scoreExperience('beginner', 'intermediate').score);
  });
});
