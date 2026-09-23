const express = require('express');
const {
  deleteSession,
  finalizeSession,
  getHistory,
  getAvailability,
  getPerformance,
  getSession,
  startSession,
  submitAnswer,
} = require('../controllers/examController');
const { authenticateStudent } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateStudent);
router.post('/', startSession);
router.get('/availability', getAvailability);
router.get('/history', getHistory);
router.get('/performance', getPerformance);
router.get('/:id', getSession);
router.delete('/:id', deleteSession);
router.post('/:id/answers', submitAnswer);
router.post('/:id/finalize', finalizeSession);

module.exports = router;
