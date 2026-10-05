const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const User = require('../../models/User');
const CreditTransaction = require('../../models/CreditTransaction');
const creditService = require('../creditService');

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
  await User.deleteMany({});
  await CreditTransaction.deleteMany({});
});

async function makeUser(balance = 0) {
  return User.create({
    firebaseUid: `uid-${Math.random()}`,
    email: `${Math.random()}@test.com`,
    displayName: 'Test User',
    credits: { balance },
  });
}

describe('grantSignupBonus', () => {
  test('credits the configured starting balance and logs a transaction', async () => {
    const user = await makeUser(0);
    const balance = await creditService.grantSignupBonus(user._id);
    expect(balance).toBe(50); // default CREDIT_STARTING_BALANCE

    const transactions = await CreditTransaction.find({ user: user._id });
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe('signup_bonus');
    expect(transactions[0].balanceAfter).toBe(50);
  });
});

describe('applyCreditDelta', () => {
  test('rejects a debit that would push balance below the minimum', async () => {
    const user = await makeUser(5);
    await expect(
      creditService.applyCreditDelta({ userId: user._id, amount: -10, type: 'learning_cost' })
    ).rejects.toThrow(creditService.InsufficientCreditsError);

    const reloaded = await User.findById(user._id);
    expect(reloaded.credits.balance).toBe(5); // unchanged - no transaction should have been logged either
    const transactions = await CreditTransaction.find({ user: user._id });
    expect(transactions).toHaveLength(0);
  });

  test('allows a debit that exactly reaches the minimum balance', async () => {
    const user = await makeUser(10);
    const balance = await creditService.applyCreditDelta({
      userId: user._id,
      amount: -10,
      type: 'learning_cost',
    });
    expect(balance).toBe(0);
  });
});

describe('settleSessionCredits', () => {
  test('credits the teacher and debits the learner based on session duration', async () => {
    const teacher = await makeUser(0);
    const learner = await makeUser(50);

    const sessionDoc = {
      _id: new mongoose.Types.ObjectId(),
      teacher: teacher._id,
      learner: learner._id,
      startTime: new Date('2026-01-01T18:00:00Z'),
      endTime: new Date('2026-01-01T20:00:00Z'), // 2 hours
    };

    await creditService.settleSessionCredits(sessionDoc);

    const [reloadedTeacher, reloadedLearner] = await Promise.all([
      User.findById(teacher._id),
      User.findById(learner._id),
    ]);
    expect(reloadedTeacher.credits.balance).toBe(20); // 2h * 10/hr
    expect(reloadedLearner.credits.balance).toBe(30); // 50 - 2h * 10/hr
  });

  test('throws and does not pay the teacher if the learner cannot afford it', async () => {
    const teacher = await makeUser(0);
    const learner = await makeUser(5); // not enough for a 2-hour session

    const sessionDoc = {
      _id: new mongoose.Types.ObjectId(),
      teacher: teacher._id,
      learner: learner._id,
      startTime: new Date('2026-01-01T18:00:00Z'),
      endTime: new Date('2026-01-01T20:00:00Z'),
    };

    await expect(creditService.settleSessionCredits(sessionDoc)).rejects.toThrow();

    const reloadedTeacher = await User.findById(teacher._id);
    expect(reloadedTeacher.credits.balance).toBe(0); // teacher never got paid
  });
});
