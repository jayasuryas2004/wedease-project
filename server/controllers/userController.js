const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields: name, email, and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user already exists - use case-insensitive search
    const userExists = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });

    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Create a new user (password will be hashed by the pre-save hook)
    const newUser = new User({
      name,
      email: email.toLowerCase(), // Store email in lowercase for consistency
      password, // Will be hashed by the pre-save hook in the User model
      role: role || 'user', // Default to 'user' role if not provided
    });

    // Save the new user to the database
    const savedUser = await newUser.save();
    console.log('User registered successfully:', savedUser.email);

    // Create JWT token
    const token = jwt.sign(
      { userId: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Set expiration time for the token to 24 hours
    );

    // Send response with token and user data (excluding password)
    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      // Check if the duplicate key error is for email
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ 
          message: 'User with this email already exists',
          error: 'duplicate_email'
        });
      } else {
        // For other duplicate key errors (like phoneNumber)
        console.log('Duplicate key error not related to email:', error.keyPattern);
        return res.status(500).json({ 
          message: 'Registration failed due to a database error. Please try again.',
          error: 'database_error'
        });
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        message: messages.join(', '),
        error: 'validation_error'
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: 'Server error during registration. Please try again later.',
      error: 'server_error'
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Please provide both email and password',
        error: 'missing_fields'
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    console.log('Login attempt for email:', email, user ? 'found' : 'not found');

    if (!user) {
      return res.status(404).json({ 
        message: 'No account found with this email. Please register first.',
        error: 'user_not_found'
      });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Incorrect password. Please try again.',
        error: 'invalid_password'
      });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } // Extended token expiration to 24 hours for better user experience
    );

    console.log('User logged in successfully:', user.email);

    // Return the token and user data in the response
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login. Please try again later.',
      error: 'server_error'
    });
  }
};

// Get user profile (protected route)
const getUserProfile = async (req, res) => {
  try {
    // Find user by ID from the token (via middleware)
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }); // Return user data excluding password
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile (protected route)
const updateUserProfile = async (req, res) => {
  const { name, email, password } = req.body;
  const updatedData = {};

  // Prepare updated data object
  if (name) updatedData.name = name;
  if (email) updatedData.email = email;
  if (password) {
    updatedData.password = await bcrypt.hash(password, 10); // Hash new password
  }

  try {
    // Find the user and update the profile
    const updatedUser = await User.findByIdAndUpdate(req.user._id, updatedData, {
      new: true, // Return the updated document
    }).select('-password'); // Exclude password from the response

    res.json(updatedUser); // Return the updated user profile
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user (optional implementation)
const logoutUser = (req, res) => {
  res.clearCookie('jwt'); // Clear JWT token from cookies
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
};
