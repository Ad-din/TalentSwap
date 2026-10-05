require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const initFirebase = require('./src/config/firebase');
const User = require('./src/models/User');
const { persistMessage, assertParticipantOrFail } = require('./src/controllers/messageController');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Every socket must present a valid Firebase ID token before it can join
  // any room or send anything - mirrors the REST requireAuth middleware.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token'));

      const admin = initFirebase();
      const decoded = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user || user.status !== 'active') return next(new Error('No active SkillSwap profile for this account'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] ${socket.user.displayName} connected (${socket.id})`);

    socket.on('join_conversation', async (conversationId, ack) => {
      try {
        await assertParticipantOrFail(conversationId, socket.user._id);
        socket.join(conversationId);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // Persists the message (same path as the REST endpoint) then broadcasts
    // it to everyone in the room, including the sender, so every client
    // renders from the single source of truth rather than an optimistic
    // local echo that could drift from what was actually saved.
    socket.on('send_message', async (payload, ack) => {
      try {
        const message = await persistMessage({
          conversationId: payload.conversationId,
          senderId: socket.user._id,
          text: String(payload.text || '').trim(),
        });
        io.to(payload.conversationId).emit('new_message', message);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] ${socket.user.displayName} disconnected (${socket.id})`);
    });
  });

  server.listen(PORT, () => {
    console.log(`[server] SkillSwap API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
