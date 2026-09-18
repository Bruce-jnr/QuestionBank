const { verifyToken } = require('../src/config/auth');
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || (decoded.role && decoded.role !== 'admin')) {
    return res.status(403).json({ error: 'Invalid or expired administrator token' });
  }

  req.user = decoded;
  next();
}

function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Student access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'student') {
    return res.status(403).json({ error: 'Invalid or expired student token' });
  }

  req.user = decoded;
  next();
}

module.exports = {
  authenticateToken,
  authenticateStudent
};

