/**
 * RASH EduHub — In-Memory Rate Limiter Middleware
 * Configurable sliding window rate limiter. No Redis dependency.
 */

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
   const now = Date.now();
   for (const [key, data] of rateLimitStore.entries()) {
      data.hits = data.hits.filter(ts => now - ts < data.windowMs);
      if (data.hits.length === 0) {
         rateLimitStore.delete(key);
      }
   }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.maxRequests - Max requests per window (default: 100)
 * @param {string} options.message - Error message when limit exceeded
 */
function createRateLimiter({ windowMs = 60000, maxRequests = 100, message = 'Too many requests, please try again later.' } = {}) {
   return (req, res, next) => {
      const key = req.ip + ':' + (req.baseUrl || req.originalUrl.split('?')[0]);
      const now = Date.now();

      if (!rateLimitStore.has(key)) {
         rateLimitStore.set(key, { hits: [], windowMs });
      }

      const entry = rateLimitStore.get(key);

      // Remove timestamps outside the current window
      entry.hits = entry.hits.filter(ts => now - ts < windowMs);

      if (entry.hits.length >= maxRequests) {
         const retryAfter = Math.ceil((windowMs - (now - entry.hits[0])) / 1000);
         res.set('Retry-After', String(retryAfter));
         return res.status(429).json({
            success: false,
            message,
            retryAfterSeconds: retryAfter
         });
      }

      entry.hits.push(now);

      // Set rate limit headers
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(maxRequests - entry.hits.length));

      next();
   };
}

// Pre-configured limiters
const authLimiter = createRateLimiter({
   windowMs: 60 * 1000,        // 1 minute
   maxRequests: 8,
   message: 'Too many authentication attempts. Please wait 1 minute before trying again.'
});

const apiLimiter = createRateLimiter({
   windowMs: 60 * 1000,        // 1 minute
   maxRequests: 120,
   message: 'API rate limit exceeded. Please slow down your requests.'
});

const uploadLimiter = createRateLimiter({
   windowMs: 60 * 1000,        // 1 minute
   maxRequests: 10,
   message: 'Too many file uploads. Please wait before uploading again.'
});

module.exports = { createRateLimiter, authLimiter, apiLimiter, uploadLimiter };
