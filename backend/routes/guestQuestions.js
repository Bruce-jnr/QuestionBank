const express = require('express');
const {
  getAvailability,
  startPreview,
  submitAnswer,
} = require('../controllers/guestQuestionController');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const previewLimiter = createRateLimiter({
  maxAttempts: 30,
  message: 'Too many guest practice requests. Please try again in 15 minutes.',
});

router.get('/availability', getAvailability);
router.post('/start', previewLimiter, startPreview);
router.post('/answer', previewLimiter, submitAnswer);

module.exports = router;
