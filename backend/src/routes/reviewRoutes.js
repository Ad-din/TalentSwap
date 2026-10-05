const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createReview, listReviewsForUser } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', requireAuth, createReview);
router.get('/user/:userId', listReviewsForUser);

module.exports = router;
