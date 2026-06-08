const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin, sanitizeBody } = require('../middleware/validation');
const { registrationLimiter, authLimiter } = require('../middleware/rateLimiter');

// Apply sanitization to all routes
router.use(sanitizeBody);

// Auth routes
router.post('/register', registrationLimiter, validateRegistration, registerUser);  // Register a new user
router.post('/login', authLimiter, validateLogin, loginUser);        // Login an existing user
router.post('/logout', logoutUser);      // Logout the user (optional)

// Profile routes (protected routes)
router.get('/profile', protect, getUserProfile);      // Get user profile (protected)
router.put('/profile', protect, updateUserProfile);   // Update user profile (protected)

module.exports = router;
