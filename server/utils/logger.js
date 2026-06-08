/**
 * Logger Utility
 * Centralized logging for the application
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

// Colors for console output
const COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  HTTP: '\x1b[35m',  // Magenta
  DEBUG: '\x1b[32m', // Green
  RESET: '\x1b[0m'
};

// Get current log level from environment
const getCurrentLogLevel = () => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
};

/**
 * Format log message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaString}`;
};

/**
 * Write to log file (optional)
 */
const writeToFile = (message) => {
  if (process.env.LOG_TO_FILE !== 'true') return;

  const logsDir = path.join(__dirname, '../../logs');
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.appendFileSync(logFile, message + '\n');
};

/**
 * Logger class
 */
class Logger {
  static log(level, message, meta = {}) {
    if (LOG_LEVELS[level] > getCurrentLogLevel()) return;

    const formattedMessage = formatMessage(level, message, meta);
    const color = COLORS[level] || COLORS.RESET;

    // Console output with colors
    console.log(`${color}${formattedMessage}${COLORS.RESET}`);

    // File output without colors
    writeToFile(formattedMessage);
  }

  static error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  static info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  static http(message, meta = {}) {
    this.log('HTTP', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
}

/**
 * HTTP Request Logger Middleware
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl}`;
    const meta = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')?.substring(0, 100) || 'unknown'
    };

    // Add user ID if authenticated
    if (req.user?.userId) {
      meta.userId = req.user.userId;
    }

    // Color-code by status
    if (res.statusCode >= 500) {
      Logger.error(message, meta);
    } else if (res.statusCode >= 400) {
      Logger.warn(message, meta);
    } else {
      Logger.http(message, meta);
    }
  });

  next();
};

/**
 * Database Query Logger
 */
const dbLogger = {
  logQuery: (operation, collection, query, duration) => {
    Logger.debug(`DB ${operation} on ${collection}`, {
      query: JSON.stringify(query).substring(0, 200),
      duration: `${duration}ms`
    });
  },

  logError: (operation, collection, error) => {
    Logger.error(`DB ${operation} failed on ${collection}`, {
      error: error.message
    });
  }
};

/**
 * Authentication Logger
 */
const authLogger = {
  loginSuccess: (email, ip) => {
    Logger.info('User login successful', { email, ip });
  },

  loginFailed: (email, ip, reason) => {
    Logger.warn('User login failed', { email, ip, reason });
  },

  logout: (userId) => {
    Logger.info('User logout', { userId });
  },

  tokenRefresh: (userId) => {
    Logger.debug('Token refreshed', { userId });
  },

  registrationSuccess: (email) => {
    Logger.info('New user registered', { email });
  },

  registrationFailed: (email, reason) => {
    Logger.warn('Registration failed', { email, reason });
  }
};

/**
 * Booking Logger
 */
const bookingLogger = {
  created: (bookingId, userId, vendorId) => {
    Logger.info('Booking created', { bookingId, userId, vendorId });
  },

  updated: (bookingId, status) => {
    Logger.info('Booking updated', { bookingId, status });
  },

  cancelled: (bookingId, userId, reason) => {
    Logger.info('Booking cancelled', { bookingId, userId, reason });
  },

  paymentReceived: (bookingId, amount) => {
    Logger.info('Payment received', { bookingId, amount });
  }
};

/**
 * System Logger
 */
const systemLogger = {
  startup: (port) => {
    Logger.info(`Server started on port ${port}`);
  },

  shutdown: (reason) => {
    Logger.info('Server shutting down', { reason });
  },

  dbConnected: (uri) => {
    Logger.info('Database connected', { uri: uri.replace(/\/\/.*@/, '//*****@') });
  },

  dbDisconnected: () => {
    Logger.warn('Database disconnected');
  },

  dbError: (error) => {
    Logger.error('Database error', { error: error.message });
  }
};

module.exports = {
  Logger,
  httpLogger,
  dbLogger,
  authLogger,
  bookingLogger,
  systemLogger
};
