const express = require('express');
const { login, verifyToken } = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimit');
const { completePasswordReset, requestPasswordReset } = require('../services/passwordResetService');
const adminLoginRateLimit = createRateLimiter();

const router = express.Router();
router.post('/login', adminLoginRateLimit, login);
router.post('/password-reset/request', createRateLimiter(), (req, res) => requestPasswordReset('admin', req, res));
router.post('/password-reset/complete', createRateLimiter(), (req, res) => completePasswordReset('admin', req, res));
router.get('/verify', verifyToken);

module.exports = router;

