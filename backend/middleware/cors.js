const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function configuredOrigins(value = process.env.CORS_ORIGINS) {
  if (!value) return new Set(DEFAULT_ORIGINS);
  return new Set(value.split(',').map((origin) => origin.trim()).filter(Boolean));
}

function cors(options = {}) {
  const allowedOrigins = configuredOrigins(options.origins);

  return function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;

    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ error: 'Origin is not allowed by CORS' });
    }

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  };
}

module.exports = { cors, configuredOrigins, DEFAULT_ORIGINS };
