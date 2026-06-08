/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Function to generate unique key for tracking
 * @param {boolean} options.skipFailedRequests - Don't count failed requests
 * @param {Function} options.skip - Function to determine if request should be skipped
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown',
    skipFailedRequests = false,
    skip = () => false
  } = options;

  return (req, res, next) => {
    // Skip if the skip function returns true
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create rate limit record
    let record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
    }

    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', record.resetTime);
      
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Increment count
    record.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.set('X-RateLimit-Reset', record.resetTime);

    // Handle failed requests if configured
    if (skipFailedRequests) {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          record.count = Math.max(0, record.count - 1);
        }
      });
    }

    next();
  };
};

// Pre-configured rate limiters for common use cases

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again after 15 minutes.'
});

/**
 * Authentication rate limiter (stricter)
 * 5 login attempts per 15 minutes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes.',
  keyGenerator: (req) => {
    // Use email + IP as key for auth attempts
    const email = req.body?.email || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${email}:${ip}`;
  }
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created from this IP, please try again after an hour.'
});

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests, please try again after an hour.'
});

/**
 * Booking rate limiter
 * 10 bookings per hour
 */
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many booking requests, please try again later.',
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?._id || 'guest';
    return `booking:${userId}`;
  }
});

/**
 * Review rate limiter
 * 5 reviews per hour
 */
const reviewLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many reviews submitted, please try again later.',
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?._id || 'guest';
    return `review:${userId}`;
  }
});

/**
 * File upload rate limiter
 * 20 uploads per hour
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many file uploads, please try again later.'
});

/**
 * Search rate limiter
 * 30 searches per minute
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many search requests, please slow down.'
});

/**
 * Admin operations rate limiter
 * 50 requests per 15 minutes
 */
const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many admin operations, please try again later.',
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?._id || 'unknown';
    return `admin:${userId}`;
  }
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  bookingLimiter,
  reviewLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter
};
