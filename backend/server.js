"use strict";

const fs = require('fs');
const path = require('path');
const express = require('express');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

const { handleApiRoutes } = require('./routes');
const { mountExpressRoutes } = require('./routes/express');
const { cors } = require('./middleware/cors');
const { securityHeaders } = require('./middleware/securityHeaders');

const app = express();
const port = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, '../frontend/dist');
const frontendIndex = path.join(frontendDir, 'index.html');
const uploadsDir = path.resolve(__dirname, 'public/uploads');

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors());

mountExpressRoutes(app);

app.use((req, res, next) => {
  if (handleApiRoutes(req, res, req.path)) return;
  next();
});

app.use('/uploads', express.static(uploadsDir));
app.use(express.static(frontendDir));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((req, res) => {
  if (req.method === 'GET' && fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  return res.status(404).send('Not found');
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
