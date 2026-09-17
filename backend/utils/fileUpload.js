const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let boundary = null;
    let contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return reject(new Error('Content-Type must be multipart/form-data'));
    }
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      return reject(new Error('No boundary found in Content-Type'));
    }
    boundary = boundaryMatch[1].trim();

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const fields = {};
        const files = {};
        const boundaryBuffer = Buffer.from(`--${boundary}`, 'utf8');
        const parts = [];
        let start = 0;

        while (true) {
          const index = buffer.indexOf(boundaryBuffer, start);
          if (index === -1) break;
          
          if (index > start) {
            parts.push(buffer.slice(start, index));
          }
          start = index + boundaryBuffer.length;
        }
        for (let partBuffer of parts) {
          if (partBuffer.length < 10) continue;
          const separator = Buffer.from('\r\n\r\n');
          const separatorIndex = partBuffer.indexOf(separator);
          if (separatorIndex === -1) continue;

          const headerBuffer = partBuffer.slice(0, separatorIndex);
          const bodyBuffer = partBuffer.slice(separatorIndex + separator.length);
          let cleanBody = bodyBuffer;
          if (cleanBody.slice(-2).equals(Buffer.from('\r\n'))) {
            cleanBody = cleanBody.slice(0, -2);
          }

          const headers = headerBuffer.toString('utf8');
          const nameMatch = headers.match(/name="([^"]+)"/);
          if (!nameMatch) continue;

          const fieldName = nameMatch[1];
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);

          if (filenameMatch) {
            const filename = filenameMatch[1];
            const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
            if (!ALLOWED_TYPES.includes(mimeType.toLowerCase())) {
              return reject(new Error(`File type ${mimeType} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`));
            }
            if (cleanBody.length > MAX_FILE_SIZE) {
              return reject(new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`));
            }
            const ext = path.extname(filename) || '.jpg';
            const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
            const filePath = path.join(UPLOAD_DIR, uniqueName);
            fs.writeFileSync(filePath, cleanBody);

            files[fieldName] = {
              filename: uniqueName,
              originalName: filename,
              path: `/uploads/${uniqueName}`,
              size: cleanBody.length,
              mimetype: mimeType
            };
          } else {
            const value = cleanBody.toString('utf8').trim();
            fields[fieldName] = value;
          }
        }

        resolve({ fields, files });
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}
function deleteFile(filePath) {
  try {
    const fullPath = path.join(UPLOAD_DIR, path.basename(filePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

module.exports = {
  parseMultipartFormData,
  deleteFile,
  UPLOAD_DIR
};

