const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 256 * 1024;

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: '.jpg', mimeType: 'image/jpeg' };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: '.png', mimeType: 'image/png' };
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return { extension: '.gif', mimeType: 'image/gif' };
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: '.webp', mimeType: 'image/webp' };
  return null;
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;
    let rejected = false;
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
      if (rejected) return;
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_REQUEST_SIZE) {
        rejected = true;
        chunks.length = 0;
        const error = new Error('Upload request exceeds the 5MB limit');
        error.statusCode = 413;
        reject(error);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) return;
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
          if (filenameMatch) {
            const filename = filenameMatch[1];
            if (cleanBody.length > MAX_FILE_SIZE) {
              const error = new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
              error.statusCode = 413;
              return reject(error);
            }
            const detectedType = detectImageType(cleanBody);
            if (!detectedType) {
              const error = new Error('File contents are not a supported JPEG, PNG, GIF, or WebP image');
              error.statusCode = 415;
              return reject(error);
            }
            const uniqueName = `${crypto.randomBytes(16).toString('hex')}${detectedType.extension}`;
            const filePath = path.join(UPLOAD_DIR, uniqueName);
            fs.writeFileSync(filePath, cleanBody);

            files[fieldName] = {
              filename: uniqueName,
              originalName: filename,
              path: `/uploads/${uniqueName}`,
              size: cleanBody.length,
              mimetype: detectedType.mimeType
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

