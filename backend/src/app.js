const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const userSkillRoutes = require('./routes/userSkillRoutes');
const matchRoutes = require('./routes/matchRoutes');
const swapRequestRoutes = require('./routes/swapRequestRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const creditRoutes = require('./routes/creditRoutes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Priority 1 - Core
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/user-skills', userSkillRoutes);
  app.use('/api/matches', matchRoutes);

  // Priority 2 - Exchange
  app.use('/api/swap-requests', swapRequestRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Priority 3 - Economy (REST surface only; ledger logic has lived in
  // services/creditService.js since Priority 1)
  app.use('/api/credits', creditRoutes);

  // Priority 4-5 (goals, ai, verification, gamification, admin) not yet built
  // - see /areas/skillswap.md development priority order.

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
