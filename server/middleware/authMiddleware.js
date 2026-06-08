const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes: middleware to verify the JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies or authorization header
  if (req.cookies.jwt) {
    token = req.cookies.jwt; // JWT from cookies
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // JWT from Authorization header
  }

  if (!token) {
    // If no token found, return 401 Unauthorized response
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user based on the decoded token (userId)
    // Add the userId to the request object even if we can't find the user
    // This allows the routes to work even without a valid user in the database
    req.user = { userId: decoded.userId };
    
    // Try to find the actual user (optional)
    try {
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = { ...req.user, ...user._doc };
      }
    } catch (userError) {
      console.log('User not found, but continuing with userId only');
    }

    // Pass control to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    // If token verification fails, return 401 Unauthorized response
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Optional: Middleware for role-based access (e.g., for admin or vendor users)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    // If the user has an admin role, proceed to the next middleware or route handler
    next();
  } else {
    // If the user is not an admin, return 403 Forbidden response
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Optional: Middleware for vendor role access
const vendor = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin')) {
    // If the user is a vendor or admin, proceed
    next();
  } else {
    // If not, return 403 Forbidden response
    res.status(403).json({ message: 'Not authorized as vendor' });
  }
};

// Optional authentication middleware - allows requests to proceed even without a valid token
const optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in cookies or authorization header
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt; // JWT from cookies
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // JWT from Authorization header
  }

  // If no token, continue as guest
  if (!token) {
    console.log('No authentication token found, proceeding as guest');
    req.user = { isGuest: true, userId: 'guest-' + Date.now() };
    return next();
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    
    // Try to find the actual user (optional)
    try {
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = { ...req.user, ...user._doc, isGuest: false };
      }
    } catch (userError) {
      console.log('User not found in database, but continuing with userId');
    }
  } catch (error) {
    console.log('Invalid token, proceeding as guest:', error.message);
    req.user = { isGuest: true, userId: 'guest-' + Date.now() };
  }
  
  // Always proceed to the next middleware
  next();
};

// Export middleware functions
module.exports = { protect, admin, vendor, optionalAuth };
