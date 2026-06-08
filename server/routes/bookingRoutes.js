const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  getAllBookings,
  checkAvailability
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateBooking, validateObjectId, sanitizeBody } = require('../middleware/validation');
const { bookingLimiter, adminLimiter } = require('../middleware/rateLimiter');

// Apply sanitization to all routes
router.use(sanitizeBody);

// Public routes
router.get('/check-availability', checkAvailability);

// Protected routes
router.post('/', protect, bookingLimiter, validateBooking, createBooking);
router.get('/', protect, getUserBookings);
router.get('/:id', protect, validateObjectId('id'), getBookingById);
router.put('/:id/cancel', protect, validateObjectId('id'), cancelBooking);

// Admin routes
router.get('/admin/all', protect, admin, adminLimiter, getAllBookings);
router.put('/:id/status', protect, admin, adminLimiter, validateObjectId('id'), updateBookingStatus);
router.put('/:id/payment', protect, admin, adminLimiter, validateObjectId('id'), updatePaymentStatus);

module.exports = router;
