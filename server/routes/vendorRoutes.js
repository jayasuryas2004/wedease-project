const express = require('express');
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  createVendorReview,
  getFeaturedVendors,
  getVendorsByCategory,
  registerVendor
} = require('../controllers/vendorController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateVendor, validateReview, validateObjectId, sanitizeBody } = require('../middleware/validation');
const { reviewLimiter, adminLimiter, searchLimiter } = require('../middleware/rateLimiter');

// Apply sanitization to all routes
router.use(sanitizeBody);

// Public routes
router.get('/', searchLimiter, getVendors);
router.get('/featured', getFeaturedVendors);
router.get('/category/:category', searchLimiter, getVendorsByCategory);
router.get('/:id', validateObjectId('id'), getVendorById);
router.post('/register', validateVendor, registerVendor); // Public vendor registration

// Protected routes
router.post('/:id/reviews', protect, validateObjectId('id'), reviewLimiter, validateReview, createVendorReview);

// Admin routes
router.post('/', protect, admin, adminLimiter, validateVendor, createVendor);
router.put('/:id', protect, admin, adminLimiter, validateObjectId('id'), validateVendor, updateVendor);
router.delete('/:id', protect, admin, adminLimiter, validateObjectId('id'), deleteVendor);

module.exports = router;
