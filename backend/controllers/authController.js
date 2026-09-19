const Admin = require('../models/Admin');
const { generateToken, comparePassword } = require('../src/config/auth');
async function login(req, res) {
  try {
        const { username, password } = req.body || {};
        if (!username || !password) {
          return res.status(400).json({ error: 'Username and password are required' });
        }
        const user = await Admin.findByUsername(username);

        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = generateToken(user.id, user.username, 'admin');
        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.writeHead(401, { 
      'Content-Type': 'application/json'
    });
    return res.end(JSON.stringify({ error: 'Token required' }));
  }

  const { verifyToken } = require('../src/config/auth');
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== 'admin') {
    res.writeHead(403, { 
      'Content-Type': 'application/json'
    });
    return res.end(JSON.stringify({ error: 'Invalid token' }));
  }

  res.writeHead(200, { 
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({ 
    valid: true, 
    user: decoded 
  }));
}

module.exports = {
  login,
  verifyToken
};

