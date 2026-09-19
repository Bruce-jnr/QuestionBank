const express = require('express');
const { loginStudent, verifyStudent } = require('../controllers/studentController');
const { authenticateStudent } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { completePasswordReset, requestPasswordReset } = require('../services/passwordResetService');

const router = express.Router();
const studentLoginRateLimit = createRateLimiter();

router.post('/login', studentLoginRateLimit, loginStudent);
router.post('/password-reset/request', createRateLimiter(), (req, res) => requestPasswordReset('student', req, res));
router.post('/password-reset/complete', createRateLimiter(), (req, res) => completePasswordReset('student', req, res));
router.get('/verify', authenticateStudent, verifyStudent);

module.exports = router;
