const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const User = require('../../models/User');
const Session = require('../../models/Session');
const Skill = require('../../models/Skill');
const SwapRequest = require('../../models/SwapRequest');
const { hasConflict } = require('../sessionController');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Session.deleteMany({});
  await User.deleteMany({});
  await Skill.deleteMany({});
  await SwapRequest.deleteMany({});
});

async function makeUser() {
  return User.create({
    firebaseUid: `uid-${Math.random()}`,
    email: `${Math.random()}@test.com`,
    displayName: 'Test User',
  });
}

describe('hasConflict (session scheduling conflict prevention)', () => {
  test('detects an overlapping session for the same user', async () => {
    const user = await makeUser();
    const other = await makeUser();
    const skill = await Skill.create({ name: 'Python', slug: 'python', category: 'Programming Languages' });
    const swapRequest = await SwapRequest.create({
      requester: user._id,
      recipient: other._id,
      offeredSkill: skill._id,
      requestedSkill: skill._id,
      status: 'accepted',
    });

    await Session.create({
      swapRequest: swapRequest._id,
      teacher: user._id,
      learner: other._id,
      skill: skill._id,
      startTime: new Date('2026-03-14T18:00:00Z'),
      endTime: new Date('2026-03-14T20:00:00Z'),
    });

    // Spec example: existing 18:00-20:00, new 19:00-21:00 -> overlap.
    const conflict = await hasConflict(
      user._id,
      new Date('2026-03-14T19:00:00Z'),
      new Date('2026-03-14T21:00:00Z')
    );
    expect(conflict).toBe(true);
  });

  test('does not flag a back-to-back, non-overlapping session', async () => {
    const user = await makeUser();
    const other = await makeUser();
    const skill = await Skill.create({ name: 'Guitar', slug: 'guitar', category: 'Music & Performing Arts' });
    const swapRequest = await SwapRequest.create({
      requester: user._id,
      recipient: other._id,
      offeredSkill: skill._id,
      requestedSkill: skill._id,
      status: 'accepted',
    });

    await Session.create({
      swapRequest: swapRequest._id,
      teacher: user._id,
      learner: other._id,
      skill: skill._id,
      startTime: new Date('2026-03-14T18:00:00Z'),
      endTime: new Date('2026-03-14T20:00:00Z'),
    });

    const conflict = await hasConflict(
      user._id,
      new Date('2026-03-14T20:00:00Z'),
      new Date('2026-03-14T21:00:00Z')
    );
    expect(conflict).toBe(false);
  });

  test('ignores cancelled sessions when checking for conflicts', async () => {
    const user = await makeUser();
    const other = await makeUser();
    const skill = await Skill.create({ name: 'Yoga', slug: 'yoga', category: 'Fitness & Wellness' });
    const swapRequest = await SwapRequest.create({
      requester: user._id,
      recipient: other._id,
      offeredSkill: skill._id,
      requestedSkill: skill._id,
      status: 'accepted',
    });

    await Session.create({
      swapRequest: swapRequest._id,
      teacher: user._id,
      learner: other._id,
      skill: skill._id,
      startTime: new Date('2026-03-14T18:00:00Z'),
      endTime: new Date('2026-03-14T20:00:00Z'),
      status: 'cancelled',
    });

    const conflict = await hasConflict(
      user._id,
      new Date('2026-03-14T18:30:00Z'),
      new Date('2026-03-14T19:30:00Z')
    );
    expect(conflict).toBe(false);
  });
});

describe('SwapRequest authorization rules', () => {
  test('rejects a swap request a user sends to themselves', async () => {
    const user = await makeUser();
    const skill = await Skill.create({ name: 'React', slug: 'react', category: 'Web Development' });

    await expect(
      SwapRequest.create({
        requester: user._id,
        recipient: user._id,
        offeredSkill: skill._id,
        requestedSkill: skill._id,
      })
    ).rejects.toThrow(/cannot send a swap request to themselves/);
  });
});
