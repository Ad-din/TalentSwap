const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getMatches,
  getMatchExplanation,
  getExchangeCycles,
} = require('../controllers/matchController');

const router = express.Router();

router.get('/', requireAuth, getMatches);
router.get('/cycles', requireAuth, getExchangeCycles);
router.get('/:userId/explanation', requireAuth, getMatchExplanation);

module.exports = router;
