const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateAvailability,
  updateLocation,
} = require('../controllers/userController');

const router = express.Router();

router.get('/:id', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);
router.put('/me/availability', requireAuth, updateAvailability);
router.put('/me/location', requireAuth, updateLocation);

module.exports = router;
