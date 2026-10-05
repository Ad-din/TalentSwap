const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMyBalance, getMyHistory } = require('../controllers/creditController');

const router = express.Router();

router.get('/me/balance', requireAuth, getMyBalance);
router.get('/me/history', requireAuth, getMyHistory);

module.exports = router;
