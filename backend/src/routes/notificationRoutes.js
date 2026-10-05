const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listMyNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/me', requireAuth, listMyNotifications);
router.post('/:id/read', requireAuth, markRead);
router.post('/read-all', requireAuth, markAllRead);

module.exports = router;
