// Simplified server for Wedease payment system
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = 3009; // Using a different port to avoid conflicts

// Import routes
const paymentRoutes = require('./server/routes/paymentRoutes');
const inviteRoutes = require('./server/routes/inviteRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Register routes
app.use('/api/payments', paymentRoutes);
app.use('/api/invites', inviteRoutes);

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wedease', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Using in-memory data storage as fallback');
    return false;
  }
}

// Connect to database
connectDB();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Mock vendor API for testing
app.get('/api/vendors/:id', (req, res) => {
  const vendorId = req.params.id;
  
  // Return a mock vendor for testing
  const mockVendor = {
    _id: vendorId,
    name: 'Luxury Palace',
    category: 'venue',
    description: 'A beautiful venue for your special day with elegant decor and spacious halls.',
    address: {
      street: '123 Wedding Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    contact: {
      phone: '+91 9876543210',
      email: 'info@luxurypalace.com',
      website: 'https://luxurypalace.com'
    },
    pricing: {
      basePrice: 50000,
      currency: 'INR',
      packages: [
        {
          name: 'Silver Package',
          description: 'Basic venue with standard decorations',
          price: 75000,
          includes: ['Venue for 6 hours', 'Basic decoration', 'Seating for 100 guests']
        },
        {
          name: 'Gold Package',
          description: 'Premium venue with elegant decorations and catering',
          price: 125000,
          includes: ['Venue for 8 hours', 'Premium decoration', 'Seating for 200 guests', 'Basic catering']
        },
        {
          name: 'Platinum Package',
          description: 'Luxury venue with exclusive decorations, catering, and photography',
          price: 200000,
          includes: ['Venue for 12 hours', 'Luxury decoration', 'Seating for 300 guests', 'Premium catering', 'Photography']
        }
      ]
    },
    images: [
      {
        url: '/images/venues/venue1.jpg',
        caption: 'Main Hall'
      },
      {
        url: '/images/venues/venue2.jpg',
        caption: 'Garden Area'
      },
      {
        url: '/images/venues/venue3.jpg',
        caption: 'Dining Space'
      }
    ],
    averageRating: 4.7,
    reviews: [
      {
        userId: 'John & Sarah',
        rating: 5,
        comment: 'Amazing venue! Our wedding was perfect thanks to the wonderful staff and beautiful location.',
        date: '2024-12-15'
      },
      {
        userId: 'Rahul & Priya',
        rating: 4.5,
        comment: 'Great experience overall. The venue was beautiful and the staff was very helpful.',
        date: '2024-11-20'
      }
    ],
    featured: true
  };
  
  res.json(mockVendor);
});

// Mock booking API for testing
app.post('/api/bookings', (req, res) => {
  // Return a mock booking response
  const mockBooking = {
    _id: 'booking_' + Date.now(),
    userId: 'user_123',
    vendorId: req.body.vendorId,
    date: req.body.date,
    time: req.body.time,
    package: {
      name: req.body.packageName || 'Standard Package',
      price: 75000
    },
    customRequests: req.body.customRequests,
    totalAmount: 75000,
    status: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date()
  };
  
  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    booking: mockBooking
  });
});

// Catch-all route for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
  console.log(`Main site: http://localhost:${PORT}`);
  console.log(`Vendor details page: http://localhost:${PORT}/vendor-details.html?id=123`);
  console.log(`Payment API: http://localhost:${PORT}/api/payments`);
});
