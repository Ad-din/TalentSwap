const { findExchangeCycles } = require('../cycleDetectionService');

describe('findExchangeCycles', () => {
  test('finds the spec example: A teaches Python/wants UI-UX, B teaches UI-UX/wants Photography, C teaches Photography/wants Python', () => {
    const nodes = [
      { userId: 'A', teachSkillIds: new Set(['python']), learnSkillIds: new Set(['uiux']) },
      { userId: 'B', teachSkillIds: new Set(['uiux']), learnSkillIds: new Set(['photo']) },
      { userId: 'C', teachSkillIds: new Set(['photo']), learnSkillIds: new Set(['python']) },
    ];
    const cycles = findExchangeCycles(nodes, (teach, learn) => teach === learn);

    expect(cycles).toHaveLength(1);
    expect(new Set(cycles[0])).toEqual(new Set(['A', 'B', 'C']));
  });

  test('does not include an unrelated user with no compatible edges', () => {
    const nodes = [
      { userId: 'A', teachSkillIds: new Set(['python']), learnSkillIds: new Set(['uiux']) },
      { userId: 'B', teachSkillIds: new Set(['uiux']), learnSkillIds: new Set(['photo']) },
      { userId: 'C', teachSkillIds: new Set(['photo']), learnSkillIds: new Set(['python']) },
      { userId: 'D', teachSkillIds: new Set(['guitar']), learnSkillIds: new Set(['piano']) },
    ];
    const cycles = findExchangeCycles(nodes, (teach, learn) => teach === learn);

    expect(cycles.every((cycle) => !cycle.includes('D'))).toBe(true);
  });

  test('returns no cycles when no mutual chain exists', () => {
    const nodes = [
      { userId: 'A', teachSkillIds: new Set(['python']), learnSkillIds: new Set(['guitar']) },
      { userId: 'B', teachSkillIds: new Set(['piano']), learnSkillIds: new Set(['photo']) },
    ];
    const cycles = findExchangeCycles(nodes, (teach, learn) => teach === learn);
    expect(cycles).toHaveLength(0);
  });
});
