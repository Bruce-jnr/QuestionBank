const express = require('express');
const { login, verifyToken } = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimit');
const adminLoginRateLimit = createRateLimiter();

const router = express.Router();
router.post('/login', adminLoginRateLimit, login);
router.get('/verify', verifyToken);

module.exports = router;

