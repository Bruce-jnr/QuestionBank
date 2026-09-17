const Admin = require('../models/Admin');
const { generateToken, comparePassword } = require('../src/config/auth');
async function login(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          return res.end(JSON.stringify({ 
            error: 'Username and password are required' 
          }));
        }
        const user = await Admin.findByUsername(username);

        if (!user) {
          res.writeHead(401, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          return res.end(JSON.stringify({ 
            error: 'Invalid username or password' 
          }));
        }
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
          res.writeHead(401, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          return res.end(JSON.stringify({ 
            error: 'Invalid username or password' 
          }));
        }
        const token = generateToken(user.id, user.username);
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username
          }
        }));

      } catch (parseError) {
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.writeHead(500, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.writeHead(401, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ error: 'Token required' }));
  }

  const { verifyToken } = require('../src/config/auth');
  const decoded = verifyToken(token);

  if (!decoded) {
    res.writeHead(403, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ error: 'Invalid token' }));
  }

  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
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

