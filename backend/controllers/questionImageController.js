const { parseMultipartFormData } = require('../utils/fileUpload');
const { uploadQuestionImage } = require('../services/s3ImageService');

async function uploadImage(req, res) {
  try {
    const { files } = await parseMultipartFormData(req, { persistFiles: false });
    const file = files?.image || Object.values(files || {})[0];
    if (!file) return res.status(400).json({ error: 'No question image uploaded' });

    const uploaded = await uploadQuestionImage(file);
    return res.status(201).json({
      image: {
        ...uploaded,
        originalName: file.originalName,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Question image upload error:', error.message);
    const configurationError = error.message.startsWith('Missing AWS image configuration');
    return res.status(error.statusCode || (configurationError ? 503 : 500)).json({
      error: configurationError ? error.message : 'Unable to upload the question image',
    });
  }
}

module.exports = { uploadImage };
