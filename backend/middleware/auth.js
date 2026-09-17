const { verifyToken } = require('../src/config/auth');
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.writeHead(401, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }).end(
      JSON.stringify({ error: 'Access token required' })
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.writeHead(403, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }).end(
      JSON.stringify({ error: 'Invalid or expired token' })
    );
  }

  req.user = decoded;
  next();
}

module.exports = {
  authenticateToken
};

