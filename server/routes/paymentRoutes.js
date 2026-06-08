const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment,
  getUserPayments,
  getPaymentById,
  requestPricing
} = require('../controllers/paymentController');

// Protected routes (require authentication)
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getUserPayments);
router.get('/:id', protect, getPaymentById);
router.post('/request-pricing', protect, requestPricing);

module.exports = router;
