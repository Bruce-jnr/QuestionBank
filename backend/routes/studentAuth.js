const express = require('express');
const { loginStudent, verifyStudent } = require('../controllers/studentController');
const { authenticateStudent } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const studentLoginRateLimit = createRateLimiter();

router.post('/login', studentLoginRateLimit, loginStudent);
router.get('/verify', authenticateStudent, verifyStudent);

module.exports = router;
