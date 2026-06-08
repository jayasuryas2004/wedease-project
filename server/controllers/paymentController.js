const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const User = require('../models/User');

// Initialize Razorpay (most popular payment gateway in India)
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'yoursecrethere'
});

// Create a payment order
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR', notes } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and amount are required'
      });
    }

    // Find the booking to ensure it exists and belongs to the user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to make a payment for this booking'
      });
    }

    // Get vendor details for receipt
    const vendor = await Vendor.findById(booking.vendorId);
    const user = await User.findById(req.user.userId);

    // Create a unique receipt ID
    const receiptId = 'WED-' + Date.now();

    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency,
      receipt: receiptId,
      payment_capture: 1, // Auto-capture payment
      notes: {
        bookingId: bookingId.toString(),
        vendorName: vendor ? vendor.name : 'Wedease Vendor',
        customerName: user ? user.name : 'Wedease Customer',
        notes: notes || ''
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Create a new payment record in our database
    const payment = new Payment({
      bookingId,
      userId: req.user.userId,
      vendorId: booking.vendorId,
      amount,
      currency,
      paymentMethod: 'pending', // Will be updated after payment
      status: 'pending',
      paymentGateway: 'razorpay',
      paymentDetails: {
        orderId: order.id,
        receiptId
      },
      notes
    });

    await payment.save();

    // Return the order details to the client
    res.status(200).json({
      success: true,
      order,
      payment: {
        id: payment._id,
        amount,
        currency
      },
      key: razorpay.key_id
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify payment after completion
const verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId, signature, paymentMethod } = req.body;

    if (!paymentId || !orderId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification details are incomplete'
      });
    }

    // Find the payment in our database
    const payment = await Payment.findOne({
      'paymentDetails.orderId': orderId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      // Update payment status to failed
      payment.status = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment details
    payment.status = 'completed';
    payment.transactionId = paymentId;
    payment.paymentMethod = paymentMethod;
    payment.paymentDetails.gatewayPaymentId = paymentId;
    payment.paymentDetails.gatewaySignature = signature;
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      // If payment amount equals total amount, mark as paid
      if (payment.amount >= booking.totalAmount) {
        booking.paymentStatus = 'paid';
      } else {
        booking.paymentStatus = 'partially_paid';
      }

      booking.paymentDetails = {
        method: paymentMethod,
        transactionId: paymentId,
        paidAmount: payment.amount,
        paidDate: new Date()
      };

      // If it's an advance payment, update booking status to confirmed
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      }

      await booking.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        bookingId: payment.bookingId
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment history for a user
const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .populate('bookingId', 'date status')
      .populate('vendorId', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment details by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId')
      .populate('vendorId', 'name category contact')
      .populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if the payment belongs to the authenticated user
    if (payment.userId._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Request pricing (create a booking with pending payment)
const requestPricing = async (req, res) => {
  try {
    const { vendorId, date, time, customRequests, packageName } = req.body;

    if (!vendorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Vendor, date, and time are required'
      });
    }

    // Find the vendor
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Create a new booking with pending status
    let packageDetails = {};
    let totalAmount = vendor.pricing.basePrice;

    // If a specific package is selected
    if (packageName) {
      const selectedPackage = vendor.pricing.packages.find(pkg => pkg.name === packageName);
      if (selectedPackage) {
        packageDetails = {
          name: selectedPackage.name,
          price: selectedPackage.price
        };
        totalAmount = selectedPackage.price;
      }
    }

    const booking = new Booking({
      userId: req.user.userId,
      vendorId,
      date: new Date(date),
      time,
      package: packageDetails,
      customRequests,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Pricing request submitted successfully',
      booking
    });
  } catch (error) {
    console.error('Error requesting pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit pricing request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// getUserPayments function is defined below

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getUserPayments,
  getPaymentById,
  requestPricing
};
