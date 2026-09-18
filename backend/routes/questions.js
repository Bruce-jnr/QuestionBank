const express = require('express');
const {
  archiveQuestion,
  createQuestion,
  importQuestions,
  listQuestions,
  updateQuestion,
} = require('../controllers/questionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/', listQuestions);
router.post('/', createQuestion);
router.post('/import', importQuestions);
router.patch('/:id', updateQuestion);
router.delete('/:id', archiveQuestion);

module.exports = router;
