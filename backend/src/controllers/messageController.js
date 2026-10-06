const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

async function listMyConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'displayName photoURL')
      .populate('swapRequest')
      .sort({ lastMessageAt: -1 });
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

async function assertParticipantOrFail(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const err = new Error('Conversation not found');
    err.statusCode = 404;
    throw err;
  }
  if (!conversation.participants.some((p) => String(p) === String(userId))) {
    const err = new Error('You are not a participant in this conversation.');
    err.statusCode = 403;
    throw err;
  }
  return conversation;
}

async function getMessages(req, res, next) {
  try {
    await assertParticipantOrFail(req.params.conversationId, req.user._id);
    const messages = await Message.find({ conversation: req.params.conversationId })
      .sort({ createdAt: 1 })
      .limit(500);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

/**
 * Persists a message and bumps the conversation's preview. Shared by the
 * REST endpoint below and the Socket.IO handler in server.js so both paths
 * write through the same logic.
 */
async function persistMessage({ conversationId, senderId, text }) {
  const conversation = await assertParticipantOrFail(conversationId, senderId);

  const message = await Message.create({ conversation: conversationId, sender: senderId, text, readBy: [senderId] });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = text.slice(0, 140);
  await conversation.save();

  return message;
}

async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required.' });

    const message = await persistMessage({
      conversationId: req.params.conversationId,
      senderId: req.user._id,
      text: text.trim(),
    });
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMyConversations, getMessages, sendMessage, persistMessage, assertParticipantOrFail };
