const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listMySkills,
  addUserSkill,
  removeUserSkill,
  listSkillsForUser,
} = require('../controllers/userSkillController');

const router = express.Router();

router.get('/me', requireAuth, listMySkills);
router.post('/me', requireAuth, addUserSkill);
router.delete('/me/:id', requireAuth, removeUserSkill);
router.get('/:userId', requireAuth, listSkillsForUser);

module.exports = router;
