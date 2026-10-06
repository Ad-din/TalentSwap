const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createSession,
  listMySessions,
  cancelSession,
  completeSession,
  reportNoShow,
} = require('../controllers/sessionController');

const router = express.Router();

router.post('/', requireAuth, createSession);
router.get('/me', requireAuth, listMySessions);
router.post('/:id/cancel', requireAuth, cancelSession);
router.post('/:id/complete', requireAuth, completeSession);
router.post('/:id/no-show', requireAuth, reportNoShow);

module.exports = router;
