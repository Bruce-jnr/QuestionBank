const { login, verifyToken } = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimit');
const adminLoginRateLimit = createRateLimiter();

const authRoutes = {
  '/api/auth/login': {
    POST(req, res) {
      adminLoginRateLimit(req, res, () => login(req, res));
    }
  },
  '/api/auth/verify': {
    GET: verifyToken
  }
};

module.exports = authRoutes;

