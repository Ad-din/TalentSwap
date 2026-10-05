const express = require('express');
const { requireFirebaseToken, requireAuth } = require('../middleware/auth');
const { register, me } = require('../controllers/authController');

const router = express.Router();

router.post('/register', requireFirebaseToken, register);
router.get('/me', requireAuth, me);

module.exports = router;
