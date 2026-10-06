const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createSwapRequest,
  listMySwapRequests,
  respondToSwapRequest,
  cancelSwapRequest,
} = require('../controllers/swapRequestController');

const router = express.Router();

router.post('/', requireAuth, createSwapRequest);
router.get('/me', requireAuth, listMySwapRequests);
router.post('/:id/respond', requireAuth, respondToSwapRequest);
router.post('/:id/cancel', requireAuth, cancelSwapRequest);

module.exports = router;
