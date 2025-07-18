import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error log file
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxSize: '20m',
    maxFiles: '14d'
  }),
  
  // Combined log file
  new DailyRotateFile({
    filename: path.join('logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxSize: '20m',
    maxFiles: '14d'
  }),
  
  // HTTP requests log file
  new DailyRotateFile({
    filename: path.join('logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxSize: '20m',
    maxFiles: '14d'
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log types
export const logError = (error, context = '') => {
  const message = context ? `${context}: ${error.message}` : error.message;
  logger.error(message, {
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (message, data = {}) => {
  logger.info(message, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const logWarn = (message, data = {}) => {
  logger.warn(message, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const logDebug = (message, data = {}) => {
  logger.debug(message, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const logHttp = (message, data = {}) => {
  logger.http(message, {
    ...data,
    timestamp: new Date().toISOString()
  });
};

// API request logging
export const logApiRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id
    };
    
    if (res.statusCode >= 400) {
      logger.error(`API Request Failed`, logData);
    } else {
      logger.http(`API Request`, logData);
    }
  });
  
  next();
};

// Database query logging
export const logDbQuery = (operation, collection, duration, query = {}) => {
  logger.debug(`Database Query`, {
    operation,
    collection,
    duration: `${duration}ms`,
    query: JSON.stringify(query)
  });
};

// Payment logging
export const logPayment = (paymentId, amount, currency, status, provider) => {
  logger.info(`Payment ${status}`, {
    paymentId,
    amount,
    currency,
    provider,
    timestamp: new Date().toISOString()
  });
};

// Security logging
export const logSecurity = (event, userId, ip, details = {}) => {
  logger.warn(`Security Event: ${event}`, {
    userId,
    ip,
    details,
    timestamp: new Date().toISOString()
  });
};

// Performance logging
export const logPerformance = (operation, duration, details = {}) => {
  if (duration > 1000) {
    logger.warn(`Slow Operation: ${operation}`, {
      duration: `${duration}ms`,
      details,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.debug(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Error tracking
export const trackError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id
    };
  }

  logger.error(`Application Error`, errorData);
};

// User activity logging
export const logUserActivity = (userId, action, details = {}) => {
  logger.info(`User Activity`, {
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

// System health logging
export const logSystemHealth = (component, status, details = {}) => {
  const level = status === 'healthy' ? 'info' : 'warn';
  logger[level](`System Health: ${component}`, {
    component,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

export { logger }; 