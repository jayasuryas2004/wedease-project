const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Public
const getVendors = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, rating, location } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category.toLowerCase();
    }
    
    if (minPrice || maxPrice) {
      filter.pricing = {};
      if (minPrice) filter.pricing.basePrice = { $gte: Number(minPrice) };
      if (maxPrice) filter.pricing.basePrice = { ...filter.pricing.basePrice, $lte: Number(maxPrice) };
    }
    
    if (rating) {
      filter.averageRating = { $gte: Number(rating) };
    }
    
    if (location) {
      filter['address.city'] = { $regex: location, $options: 'i' };
    }
    
    const vendors = await Vendor.find(filter).sort({ featured: -1, averageRating: -1 });
    
    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Public
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (vendor) {
      res.json(vendor);
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private/Admin
const createVendor = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      address,
      contact,
      pricing,
      images,
      availability
    } = req.body;
    
    const vendor = new Vendor({
      name,
      category,
      description,
      address,
      contact,
      pricing,
      images,
      availability
    });
    
    const createdVendor = await vendor.save();
    
    res.status(201).json(createdVendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
const updateVendor = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      address,
      contact,
      pricing,
      images,
      availability,
      featured
    } = req.body;
    
    const vendor = await Vendor.findById(req.params.id);
    
    if (vendor) {
      vendor.name = name || vendor.name;
      vendor.category = category || vendor.category;
      vendor.description = description || vendor.description;
      vendor.address = address || vendor.address;
      vendor.contact = contact || vendor.contact;
      vendor.pricing = pricing || vendor.pricing;
      vendor.images = images || vendor.images;
      vendor.availability = availability || vendor.availability;
      
      if (featured !== undefined) {
        vendor.featured = featured;
      }
      
      const updatedVendor = await vendor.save();
      
      res.json(updatedVendor);
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (vendor) {
      await vendor.remove();
      res.json({ message: 'Vendor removed' });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a review
// @route   POST /api/vendors/:id/reviews
// @access  Private
const createVendorReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const vendor = await Vendor.findById(req.params.id);
    
    if (vendor) {
      // Check if user already reviewed
      const alreadyReviewed = vendor.reviews.find(
        (review) => review.userId.toString() === req.user._id.toString()
      );
      
      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Vendor already reviewed' });
      }
      
      const review = {
        userId: req.user._id,
        rating: Number(rating),
        comment
      };
      
      vendor.reviews.push(review);
      
      // Update average rating
      const totalRating = vendor.reviews.reduce((acc, item) => acc + item.rating, 0);
      vendor.averageRating = totalRating / vendor.reviews.length;
      
      await vendor.save();
      
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Vendor not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get featured vendors
// @route   GET /api/vendors/featured
// @access  Public
const getFeaturedVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ featured: true }).limit(5);
    
    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get vendors by category
// @route   GET /api/vendors/category/:category
// @access  Public
const getVendorsByCategory = async (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    
    const vendors = await Vendor.find({ category });
    
    res.json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register a new vendor (public registration)
// @route   POST /api/vendors/register
// @access  Public
const registerVendor = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      address,
      contact,
      pricing,
      images,
      availability,
      services,
      businessInfo
    } = req.body;
    
    // Check if vendor already exists with this email
    const existingVendor = await Vendor.findOne({ 'contact.email': contact.email });
    
    if (existingVendor) {
      return res.status(400).json({ 
        message: 'A vendor with this email already exists. Please contact support if you need assistance.' 
      });
    }
    
    // Create new vendor with pending status
    const vendor = new Vendor({
      name,
      category,
      description,
      address,
      contact,
      pricing,
      images: images || [],
      availability: availability || {},
      services: services || [],
      businessInfo: businessInfo || {},
      featured: false,
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
      status: 'pending' // New vendors start as pending for admin approval
    });
    
    const createdVendor = await vendor.save();
    
    // Send success response
    res.status(201).json({
      message: 'Vendor registration successful! Your profile is under review and will be activated within 24-48 hours.',
      vendor: {
        id: createdVendor._id,
        name: createdVendor.name,
        category: createdVendor.category,
        status: createdVendor.status
      }
    });
    
    // TODO: Send email notification to admin about new vendor registration
    // TODO: Send confirmation email to vendor
    
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed. Please try again later.',
      error: error.message 
    });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  createVendorReview,
  getFeaturedVendors,
  getVendorsByCategory,
  registerVendor
};
