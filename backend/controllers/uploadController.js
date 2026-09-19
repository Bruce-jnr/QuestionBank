const { parseMultipartFormData } = require('../utils/fileUpload');
async function uploadFile(req, res) {
  try {
    const { files } = await parseMultipartFormData(req);
    
    if (!files || Object.keys(files).length === 0) {
      res.writeHead(400, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({ error: 'No file uploaded' }));
    }
    const file = Object.values(files)[0];

    return res.json({
      success: true,
      file: {
        path: file.path,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(error.statusCode || 400).json({
      error: error.message || 'File upload failed'
    });
  }
}

module.exports = {
  uploadFile
};

