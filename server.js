// Load environment variables
require('dotenv').config();

// Required dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 9876;

// Import routes
const inviteRoutes = require('./server/routes/inviteRoutes');
const paymentRoutes = require('./server/routes/paymentRoutes');
const userRoutes = require('./server/routes/userRoutes');
const vendorRoutes = require('./server/routes/vendorRoutes');
const bookingRoutes = require('./server/routes/bookingRoutes');
const authRoutes = require('./server/routes/auth');

// Import middleware
const { errorHandler, notFoundHandler } = require('./server/middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./server/middleware/rateLimiter');
const { httpLogger, systemLogger } = require('./server/utils/logger');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true
}));

// HTTP Request Logger
app.use(httpLogger);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/auth', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/invites', inviteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);

// Check if environment variables are loaded correctly
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in .env file');
  process.exit(1); // Stop the server if secret is not defined
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1); // Stop the server if DB URI is not defined
}

// Database connection
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    systemLogger.dbConnected(process.env.MONGODB_URI);
    console.log(`MongoDB connected successfully`);
    
    return true;
  } catch (error) {
    systemLogger.dbError(error);
    console.error('MongoDB connection error:', error);
    console.log('Using in-memory data storage as fallback');
    
    return false;
  }
}

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  systemLogger.dbDisconnected();
});

mongoose.connection.on('error', (err) => {
  systemLogger.dbError(err);
});

connectDB();

// User Authentication and Token Generation
const User = require('./server/models/User'); // Correct path to User model

// User login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password (assuming you have hashed passwords)
    const isMatch = await user.comparePassword(password); // Implement comparePassword method in User model
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the token back to the client (store in cookie or header)
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protect Routes with JWT Middleware
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request object
    next();
  } catch (error) {
    console.error('Invalid token', error);
    res.status(400).json({ message: 'Invalid token' });
  }
}

// Example of a protected route
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.user.userId });
});

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for frontend (if using a single-page application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 for API routes
app.use('/api/*', notFoundHandler);

// Global error handling middleware
app.use(errorHandler);

// Start server with port fallback mechanism
const startServer = (port) => {
  try {
    const server = app.listen(port, () => {
      systemLogger.startup(port);
      console.log(`Server running on port ${port}`);
      console.log(`Main site available at: http://localhost:${port}`);
      console.log(`Admin dashboard available at: http://localhost:${port}/admin`);
      console.log(`API Health check: http://localhost:${port}/api/health`);
    });
    
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', e);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      systemLogger.shutdown('SIGTERM');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server closed gracefully');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      systemLogger.shutdown('SIGINT');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('Server closed gracefully');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

// Start the server with initial port
startServer(PORT);
