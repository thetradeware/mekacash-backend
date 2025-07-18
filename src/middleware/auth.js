import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { getCache, setCache } from '../config/redis.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check cache first
    let user = await getCache(`user:${decoded.userId}`);
    
    if (!user) {
      // If not in cache, get from database
      user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Cache user data
      await setCache(`user:${decoded.userId}`, user, 3600);
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Middleware to check if user is verified
export const requireVerification = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required. Please verify your email address.'
      });
    }

    if (!req.user.isPhoneVerified) {
      return res.status(403).json({
        success: false,
        message: 'Phone verification required. Please verify your phone number.'
      });
    }

    next();
  } catch (error) {
    logger.error('Verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification check.'
    });
  }
};

// Middleware to check user role
export const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during role check.'
      });
    }
  };
};

// Middleware to check if user is admin
export const requireAdmin = requireRole(['admin', 'super-admin']);

// Middleware to check if user is super admin
export const requireSuperAdmin = requireRole(['super-admin']);

// Middleware to check if user is runner
export const requireRunner = requireRole(['runner']);

// Middleware to check if user is provider
export const requireProvider = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Providers can be users with provider role or dedicated providers
    if (!['user', 'provider', 'admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Provider permissions required.'
      });
    }

    next();
  } catch (error) {
    logger.error('Provider middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during provider check.'
    });
  }
};

// Middleware to check if user owns the resource
export const requireOwnership = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.'
        });
      }

      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.user.toString() !== req.user._id.toString() && 
          !['admin', 'super-admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only modify your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership check.'
      });
    }
  };
};

// Middleware to rate limit by user
export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    try {
      const userId = req.user._id.toString();
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old requests
      if (requests.has(userId)) {
        requests.set(userId, requests.get(userId).filter(timestamp => timestamp > windowStart));
      } else {
        requests.set(userId, []);
      }

      const userRequests = requests.get(userId);

      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.'
        });
      }

      userRequests.push(now);
      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next();
    }
  };
};

// Middleware to log user activity
export const logActivity = (action) => {
  return (req, res, next) => {
    try {
      logger.info(`User activity: ${req.user._id} - ${action} - ${req.originalUrl}`);
      next();
    } catch (error) {
      logger.error('Activity logging error:', error);
      next();
    }
  };
};

// Middleware to update last active
export const updateLastActive = async (req, res, next) => {
  try {
    if (req.user) {
      req.user.stats.lastActive = new Date();
      await req.user.save();
    }
    next();
  } catch (error) {
    logger.error('Update last active error:', error);
    next();
  }
}; 