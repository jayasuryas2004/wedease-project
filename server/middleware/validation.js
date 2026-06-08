/**
 * Input Validation Middleware
 * Provides validation for all API routes
 */

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports multiple formats)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.statusCode = 400;
  }
}

/**
 * Validate user registration data
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password, phoneNumber } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else {
    if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }
    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must not exceed 128 characters' });
    }
  }

  // Phone number validation (optional)
  if (phoneNumber && !phoneRegex.test(phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Please provide a valid phone number' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize inputs
  req.body.name = name.trim();
  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Validate user login data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(email)) {
    errors.push({ field: 'email', message: 'Please provide a valid email address' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize email
  req.body.email = email.toLowerCase().trim();

  next();
};

/**
 * Validate booking creation data
 */
const validateBooking = (req, res, next) => {
  const { vendorId, date, time, totalAmount } = req.body;
  const errors = [];

  // Vendor ID validation
  if (!vendorId) {
    errors.push({ field: 'vendorId', message: 'Vendor ID is required' });
  } else if (!objectIdRegex.test(vendorId)) {
    errors.push({ field: 'vendorId', message: 'Invalid vendor ID format' });
  }

  // Date validation
  if (!date) {
    errors.push({ field: 'date', message: 'Booking date is required' });
  } else {
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      errors.push({ field: 'date', message: 'Invalid date format' });
    } else if (bookingDate < new Date()) {
      errors.push({ field: 'date', message: 'Booking date cannot be in the past' });
    }
  }

  // Time validation (optional but validate format if provided)
  if (time && typeof time === 'string') {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      errors.push({ field: 'time', message: 'Invalid time format. Use HH:MM' });
    }
  }

  // Total amount validation
  if (totalAmount !== undefined) {
    const amount = Number(totalAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push({ field: 'totalAmount', message: 'Total amount must be a positive number' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate vendor creation data
 */
const validateVendor = (req, res, next) => {
  const { name, category, description, pricing } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push({ field: 'name', message: 'Vendor name is required' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Vendor name must be at least 2 characters' });
  }

  // Category validation
  const validCategories = ['venue', 'catering', 'photography', 'videography', 'makeup', 'decor', 'music', 'transportation', 'other'];
  if (!category) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (!validCategories.includes(category.toLowerCase())) {
    errors.push({ field: 'category', message: `Category must be one of: ${validCategories.join(', ')}` });
  }

  // Description validation (optional but validate length if provided)
  if (description && description.length > 2000) {
    errors.push({ field: 'description', message: 'Description must not exceed 2000 characters' });
  }

  // Pricing validation
  if (pricing) {
    if (pricing.basePrice !== undefined) {
      const basePrice = Number(pricing.basePrice);
      if (isNaN(basePrice) || basePrice < 0) {
        errors.push({ field: 'pricing.basePrice', message: 'Base price must be a positive number' });
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize inputs
  if (name) req.body.name = name.trim();
  if (category) req.body.category = category.toLowerCase().trim();
  if (description) req.body.description = description.trim();

  next();
};

/**
 * Validate review data
 */
const validateReview = (req, res, next) => {
  const { rating, comment } = req.body;
  const errors = [];

  // Rating validation
  if (rating === undefined || rating === null) {
    errors.push({ field: 'rating', message: 'Rating is required' });
  } else {
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' });
    }
  }

  // Comment validation (optional but validate length if provided)
  if (comment && comment.length > 1000) {
    errors.push({ field: 'comment', message: 'Comment must not exceed 1000 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Sanitize comment
  if (comment) req.body.comment = comment.trim();

  next();
};

/**
 * Validate MongoDB ObjectId parameter
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * General sanitization middleware
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Don't sanitize password fields
        if (!key.toLowerCase().includes('password')) {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      }
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateBooking,
  validateVendor,
  validateReview,
  validateObjectId,
  sanitizeBody,
  sanitizeInput,
  ValidationError
};
