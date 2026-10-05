const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listMyConversations,
  getMessages,
  sendMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', requireAuth, listMyConversations);
router.get('/conversations/:conversationId/messages', requireAuth, getMessages);
router.post('/conversations/:conversationId/messages', requireAuth, sendMessage);

module.exports = router;
