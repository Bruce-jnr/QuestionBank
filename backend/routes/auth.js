const { login, verifyToken } = require('../controllers/authController');
const authRoutes = {
  '/api/auth/login': {
    POST: login
  },
  '/api/auth/verify': {
    GET: verifyToken
  }
};

module.exports = authRoutes;

