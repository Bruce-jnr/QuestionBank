const express = require('express');
const { submitContact } = require('../controllers/contactController');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const contactRateLimit = createRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many messages. Please try again in 15 minutes.',
});

router.post('/', contactRateLimit, submitContact);

module.exports = router;
