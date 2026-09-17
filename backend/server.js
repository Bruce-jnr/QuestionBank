"use strict";

const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });
const http = require("http");
const fs = require("fs");
const { URL } = require("url");
const { handleApiRoutes } = require("./routes");

const port = process.env.PORT || 3000;
const frontendDir = path.resolve(__dirname, '../frontend/dist');
const uploadsDir = path.resolve(__dirname, 'public/uploads');

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || "application/octet-stream";
}

function resolveFile(requestPath) {
  let cleanPath = requestPath.split('?')[0].split('#')[0];
  let normalized = cleanPath.replace(/^\/+/, '');
  if (normalized.includes('..') || normalized.includes('//')) {
    return null;
  }
  
  const isUpload = normalized.startsWith('uploads/');
  const baseDir = isUpload ? uploadsDir : frontendDir;
  const relativePath = isUpload ? normalized.slice('uploads/'.length) : normalized;
  let filePath = path.resolve(baseDir, relativePath || 'index.html');

  if (filePath !== baseDir && !filePath.startsWith(`${baseDir}${path.sep}`)) {
    return null;
  }
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  } catch (err) {
    return null;
  }
  if (!isUpload && !path.extname(normalized)) {
    const indexPath = path.join(frontendDir, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  return null;
}

function sendFile(res, filePath) {
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": guessMime(filePath) });

  stream.on("error", (err) => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
    }
    res.end("Internal Server Error");
  });

  stream.pipe(res);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (handleApiRoutes(req, res, pathname)) {
    return;
  }
  if (pathname.startsWith('/api/')) {
    sendNotFound(res);
    return;
  }

  const filePath = resolveFile(pathname);

  if (!filePath) {
    sendNotFound(res);
    return;
  }

  sendFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
