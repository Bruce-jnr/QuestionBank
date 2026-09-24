const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

const requiredVariables = [
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'AWS_MEDIA_BASE_URL',
];

function configuration() {
  const missing = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length)
    throw new Error(`Missing AWS image configuration: ${missing.join(', ')}`);
  return {
    bucket: process.env.AWS_S3_BUCKET_NAME.trim(),
    mediaBaseUrl: process.env.AWS_MEDIA_BASE_URL.trim().replace(/\/$/, ''),
    prefix: (process.env.AWS_S3_IMAGE_PREFIX || 'question-images').replace(
      /^\/+|\/+$/g,
      '',
    ),
    region: process.env.AWS_REGION.trim(),
  };
}

async function uploadQuestionImage(file) {
  const config = configuration();
  const extension = path.extname(file.filename).toLowerCase();
  const key = `${config.prefix}/${crypto.randomUUID()}${extension}`;
  const client = new S3Client({ region: config.region });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
      ServerSideEncryption: 'AES256',
    }),
  );

  return {
    key,
    url: `${config.mediaBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`,
  };
}

module.exports = { uploadQuestionImage };
