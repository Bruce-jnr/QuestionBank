const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

function clientAddress(req) {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown'
  );
}

function createRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  message = 'Too many login attempts. Please try again in 15 minutes.',
} = {}) {
  const clients = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    if (clients.size > 1000) {
      for (const [address, value] of clients) {
        if (value.resetAt <= now) clients.delete(address);
      }
    }
    const key = clientAddress(req);
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    const remaining = Math.max(0, maxAttempts - entry.count);
    res.setHeader('RateLimit-Limit', String(maxAttempts));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count >= maxAttempts) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('RateLimit-Remaining', '0');

      const payload = JSON.stringify({
        error: message,
      });

      if (typeof res.status === 'function') {
        return res.status(429).json(JSON.parse(payload));
      }

      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(payload);
    }

    entry.count += 1;
    res.setHeader('RateLimit-Remaining', String(maxAttempts - entry.count));
    return next();
  };
}

module.exports = {
  createRateLimiter,
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_WINDOW_MS,
};
