const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  listSkills,
  listCategories,
  createSkill,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');

const router = express.Router();

router.get('/', listSkills);
router.get('/categories', listCategories);
router.post('/', requireAuth, requireRole('admin'), createSkill);
router.patch('/:id', requireAuth, requireRole('admin'), updateSkill);
router.delete('/:id', requireAuth, requireRole('admin'), deleteSkill);

module.exports = router;
