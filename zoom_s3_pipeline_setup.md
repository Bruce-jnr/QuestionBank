# Zoom Recording Webhook & AWS S3 Auto-Upload Pipeline

This guide provides an end-to-end implementation for automatically capturing live Zoom meeting recordings and streaming them directly to an AWS S3 bucket using Node.js, Express, and the AWS SDK v3.

---

## Table of Contents
1. [Overview & Prerequisites](#1-overview--prerequisites)
2. [Environment Variables (`.env`)](#2-environment-variables-env)
3. [Implementation Code (`server.js`)](#3-implementation-code-serverjs)
4. [Deployment & Zoom Webhook Setup](#4-deployment--zoom-webhook-setup)

---

## 1. Overview & Prerequisites

### Tech Stack
* **Runtime:** Node.js (v18+)
* **Framework:** Express
* **AWS SDK:** `@aws-sdk/client-s3` & `@aws-sdk/lib-storage`
* **Security:** HMAC-SHA256 signature verification

### Required Packages
Install dependencies via npm:
```bash
npm install express @aws-sdk/client-s3 @aws-sdk/lib-storage dotenv
```

---

## 2. Environment Variables (`.env`)

Save this file as `.env` in your project root.

```env
PORT=3000

# Zoom Marketplace Webhook Secret Token
ZOOM_WEBHOOK_SECRET_TOKEN=your_zoom_webhook_secret_token

# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name
```

---

## 3. Implementation Code (`server.js`)

Save this file as `server.js`.

```javascript
import express from 'express';
import crypto from 'crypto';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * 1. Zoom Signature Verification Helper
 * Compares computed HMAC SHA-256 with the x-zm-signature header sent by Zoom
 */
function verifyZoomSignature(req) {
  const message = `v0:${req.headers['x-zm-request-timestamp']}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');
  const signature = `v0=${hashForVerify}`;

  return req.headers['x-zm-signature'] === signature;
}

/**
 * 2. Zoom Webhook Route Handler
 */
app.post('/api/webhooks/zoom', async (req, res) => {
  try {
    // --- STEP A: Zoom Endpoint Validation Challenge ---
    if (req.body.event === 'endpoint.url_validation') {
      const plainToken = req.body.payload.plainToken;

      const encryptedToken = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
        .update(plainToken)
        .digest('hex');

      return res.status(200).json({
        plainToken,
        encryptedToken,
      });
    }

    // --- STEP B: Security Verification ---
    if (!verifyZoomSignature(req)) {
      console.error('Invalid Zoom Webhook Signature');
      return res.status(401).send('Unauthorized');
    }

    // --- STEP C: Process recording.completed Event ---
    if (req.body.event === 'recording.completed') {
      const { object: recordingData } = req.body.payload;
      const downloadToken = req.body.download_token;

      // Locate primary MP4 video file
      const videoFile = recordingData.recording_files.find(
        (file) => file.file_type === 'MP4' && file.recording_type !== 'audio_only'
      );

      if (!videoFile) {
        console.log('No eligible MP4 video recording found.');
        return res.status(200).send('No MP4 file found');
      }

      console.log(`Starting transfer for Meeting ID: ${recordingData.id}`);

      // Respond to Zoom immediately (200 OK) to avoid timeout
      res.status(200).send('Event received');

      // Execute background stream transfer
      processRecordingUpload(recordingData, videoFile, downloadToken);
      return;
    }

    return res.status(200).send('Event ignored');
  } catch (error) {
    console.error('Error handling Zoom webhook:', error);
    return res.status(500).send('Server Error');
  }
});

/**
 * 3. Background Pipeline: Streams Video from Zoom -> AWS S3
 */
async function processRecordingUpload(recordingData, videoFile, downloadToken) {
  try {
    const downloadUrl = `${videoFile.download_url}?access_token=${downloadToken}`;

    const zoomResponse = await fetch(downloadUrl);

    if (!zoomResponse.ok) {
      throw new Error(`Failed to download from Zoom: ${zoomResponse.statusText}`);
    }

    const fileStream = zoomResponse.body;
    const s3Key = `zoom-recordings/${recordingData.id}/${videoFile.id}.mp4`;

    // Multipart Stream to handle large video files efficiently
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileStream,
        ContentType: 'video/mp4',
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 10, // 10MB chunk size
    });

    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(`S3 Upload Progress [${s3Key}]: ${progress.loaded} bytes uploaded`);
    });

    await parallelUploads3.done();
    console.log(`Successfully uploaded Zoom recording to S3: ${s3Key}`);

  } catch (err) {
    console.error('Failed to upload recording to S3:', err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Zoom Webhook Server running on port ${PORT}`));
```

---

## 4. Deployment & Zoom Webhook Setup

1. **Deploy Endpoint:** Deploy your Node.js application to a publicly accessible host (e.g., AWS EC2, DigitalOcean VPS, or Vercel/Render).
2. **Configure Zoom App:**
   * Go to the [Zoom App Marketplace](https://marketplace.zoom.us/).
   * Create or select a **Server-to-Server OAuth App**.
   * Under **Feature -> Event Subscriptions**, add a subscription and set the endpoint URL to `https://your-domain.com/api/webhooks/zoom`.
   * Subscribe to the `recording.completed` event under **Cloud Recording**.
3. **Verify Endpoint:** Zoom will send the `endpoint.url_validation` payload. The server will respond with the hashed token, marking the webhook active.
