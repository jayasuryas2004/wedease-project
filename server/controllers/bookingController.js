const Booking = require('../models/Booking');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      vendorId,
      date,
      time,
      package,
      customRequests,
      totalAmount
    } = req.body;

    // Check if vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Create new booking
    const booking = new Booking({
      userId: req.user._id,
      vendorId,
      date,
      time,
      package,
      customRequests,
      totalAmount,
      status: 'pending'
    });

    const createdBooking = await booking.save();

    // Add booking to user's bookings array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { bookings: createdBooking._id } }
    );

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('vendorId', 'name category images')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vendorId', 'name category description images pricing contact address');

    // Check if booking exists and belongs to user or user is admin
    if (booking && (booking.userId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (booking) {
      booking.status = status || booking.status;
      
      const updatedBooking = await booking.save();
      
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (booking) {
      booking.paymentStatus = paymentStatus || booking.paymentStatus;
      
      if (paymentDetails) {
        booking.paymentDetails = {
          ...booking.paymentDetails,
          ...paymentDetails
        };
      }
      
      const updatedBooking = await booking.save();
      
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    // Check if booking exists and belongs to user or user is admin
    if (booking && (booking.userId.toString() === req.user._id.toString() || req.user.role === 'admin')) {
      // Only allow cancellation if status is pending or confirmed
      if (booking.status === 'pending' || booking.status === 'confirmed') {
        booking.status = 'cancelled';
        
        const updatedBooking = await booking.save();
        
        res.json(updatedBooking);
      } else {
        res.status(400).json({ message: 'Booking cannot be cancelled at this stage' });
      }
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookings (admin only)
// @route   GET /api/bookings/admin
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('userId', 'name email')
      .populate('vendorId', 'name category')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check vendor availability
// @route   GET /api/bookings/check-availability
// @access  Public
const checkAvailability = async (req, res) => {
  try {
    const { vendorId, date } = req.query;
    
    // Format date to match the format in the database
    const formattedDate = new Date(date);
    
    const vendor = await Vendor.findById(vendorId);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    // Find availability for the requested date
    const availabilityForDate = vendor.availability.find(
      (a) => new Date(a.date).toDateString() === formattedDate.toDateString()
    );
    
    if (!availabilityForDate) {
      return res.status(404).json({ message: 'No availability for the selected date' });
    }
    
    // Return available time slots
    res.json({
      date: availabilityForDate.date,
      timeSlots: availabilityForDate.timeSlots.filter(slot => !slot.isBooked)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelBooking,
  getAllBookings,
  checkAvailability
};
