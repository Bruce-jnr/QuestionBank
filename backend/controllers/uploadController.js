const { parseMultipartFormData } = require('../utils/fileUpload');
const { verifyToken } = require('../src/config/auth');
async function uploadFile(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.writeHead(401, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({ error: 'Authentication required' }));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.writeHead(403, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({ error: 'Invalid or expired token' }));
    }

    const { files } = await parseMultipartFormData(req);
    
    if (!files || Object.keys(files).length === 0) {
      res.writeHead(400, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({ error: 'No file uploaded' }));
    }
    const file = Object.values(files)[0];

    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      success: true,
      file: {
        path: file.path,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size
      }
    }));

  } catch (error) {
    console.error('Upload error:', error);
    res.writeHead(500, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ 
      error: error.message || 'File upload failed' 
    }));
  }
}

module.exports = {
  uploadFile
};

