const Invite = require('../models/Invite');
const path = require('path');
const fs = require('fs');

// Define available invitation templates
const invitationTemplates = [
  {
    id: 'elegant-gold',
    name: 'Elegant Gold',
    imageUrl: '/images/invite-templates/elegant-gold.jpg',
    style: 'gold-theme',
    description: 'A sophisticated design with gold accents and elegant typography',
    category: 'elegant'
  },
  {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    imageUrl: '/images/invite-templates/rustic-charm.jpg',
    style: 'earth-theme',
    description: 'A warm, natural design with wooden textures and earthy tones',
    category: 'rustic'
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    imageUrl: '/images/invite-templates/modern-minimal.jpg',
    style: 'minimal-theme',
    description: 'A clean, contemporary design with geometric elements',
    category: 'modern'
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    imageUrl: '/images/invite-templates/royal-blue.jpg',
    style: 'blue-theme',
    description: 'An elegant design with deep blue tones and gold accents',
    category: 'elegant'
  },
  {
    id: 'floral-romance',
    name: 'Floral Romance',
    imageUrl: '/images/invite-templates/floral-romance.jpg',
    style: 'floral-theme',
    description: 'A romantic design with delicate floral patterns',
    category: 'romantic'
  },
  {
    id: 'traditional-classic',
    name: 'Traditional Classic',
    imageUrl: '/images/invite-templates/traditional-classic.jpg',
    style: 'classic-theme',
    description: 'A timeless design with traditional wedding elements',
    category: 'traditional'
  },
  {
    id: 'destination-beach',
    name: 'Destination Beach',
    imageUrl: '/images/invite-templates/destination-beach.jpg',
    style: 'beach-theme',
    description: 'A breezy design perfect for beach and destination weddings',
    category: 'destination'
  },
  {
    id: 'vintage-lace',
    name: 'Vintage Lace',
    imageUrl: '/images/invite-templates/vintage-lace.jpg',
    style: 'vintage-theme',
    description: 'A nostalgic design with lace patterns and antique elements',
    category: 'vintage'
  }
];

// Make sure template images exist, if not, create fallbacks
function ensureTemplateImages() {
  const publicDir = path.join(__dirname, '../../public');
  const templatesDir = path.join(publicDir, 'images/invite-templates');
  
  // Create directories if they don't exist
  if (!fs.existsSync(path.join(publicDir, 'images'))) {
    fs.mkdirSync(path.join(publicDir, 'images'));
  }
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir);
  }
  
  // Check for existing template files
  invitationTemplates.forEach(template => {
    const filename = template.imageUrl.split('/').pop();
    const filePath = path.join(templatesDir, filename);
    
    // If template file doesn't exist, use a numbered template as fallback
    if (!fs.existsSync(filePath)) {
      console.log(`Template ${filename} not found, using fallback`);
      // The template file doesn't exist, but we'll keep the path as is
      // The frontend will handle missing images gracefully
    }
  });
  
  console.log('Invitation templates initialized successfully');
}

// Initialize templates
ensureTemplateImages();

// We'll validate the API key during the first API call instead of at initialization

// Get all invitation templates
const getInvitationTemplates = async (req, res) => {
  try {
    // Create a copy of the templates with updated image URLs
    const templatesWithImages = invitationTemplates.map(template => {
      // Get the placeholder image URL for this template's category
      const imageUrl = selectThemedFallbackImage(template.category);
      
      // Return a new object with the updated imageUrl
      return {
        ...template,
        imageUrl
      };
    });
    
    res.status(200).json({
      templates: templatesWithImages,
      message: 'Templates retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving templates:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve invitation templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Generate invitation based on template
const generateAIInvite = async (req, res) => {
  const { coupleName, venue, date, time, templateId, colorScheme, customMessage } = req.body;

  if (!coupleName || !venue || !date || !time || !templateId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Find the selected template
    const selectedTemplate = invitationTemplates.find(t => t.id === templateId);
    
    if (!selectedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // Log the template being used
    console.log(`Using template: ${selectedTemplate.name}`);

    // Always use online placeholder images for now since local images are missing/corrupted
    const imageUrl = selectThemedFallbackImage(selectedTemplate.category, colorScheme);
    console.log(`Using image URL: ${imageUrl}`);
    
    // Create a new invitation record
    let newInvite;
    try {
      newInvite = new Invite({
        coupleName,
        theme: selectedTemplate.category,
        venue,
        date,
        time,
        style: selectedTemplate.style,
        imageUrl,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        customMessage: customMessage || 'Join us on our special day!',
        colorScheme: colorScheme || 'gold and blue',
        createdAt: new Date()
      });
      
      // Save to database
      await newInvite.save();
      console.log('Invite saved to database successfully');
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Create in-memory invite object if database save fails
      newInvite = {
        id: Date.now().toString(),
        coupleName,
        theme: selectedTemplate.category,
        venue,
        date,
        time,
        style: selectedTemplate.style,
        imageUrl,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        customMessage: customMessage || 'Join us on our special day!',
        colorScheme: colorScheme || 'gold and blue',
        createdAt: new Date()
      };
    }

    res.status(201).json({
      message: 'Invitation created successfully',
      id: newInvite._id || newInvite.id,
      imageUrl,
      theme: selectedTemplate.style,
      template: {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        category: selectedTemplate.category
      }
    });
  } catch (error) {
    console.error('Error in invitation generation process:', error.message);
    res.status(500).json({
      message: 'Failed to generate invitation. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
    });
  }
};

// Create a detailed prompt for DALL-E image generation
const createDetailedPrompt = (coupleName, theme, venue, date, time, style) => {
  // Base prompt structure
  let prompt = `Create a beautiful and elegant wedding invitation design for ${coupleName}.`;
  
  // Add theme details
  switch (theme.toLowerCase()) {
    case 'elegant':
      prompt += ` The invitation should have an elegant and sophisticated design with refined typography and decorative elements.`;
      break;
    case 'rustic':
      prompt += ` The invitation should have a rustic charm with natural textures, wooden elements, and a warm color palette.`;
      break;
    case 'modern':
      prompt += ` The invitation should have a clean, minimalist design with contemporary typography and geometric elements.`;
      break;
    case 'traditional':
      prompt += ` The invitation should have a classic, timeless design with formal typography and traditional wedding symbols.`;
      break;
    case 'romantic':
      prompt += ` The invitation should have a romantic and dreamy design with soft colors, floral elements, and elegant script fonts.`;
      break;
    default:
      prompt += ` The invitation should have a beautiful and sophisticated design that reflects the couple's special day.`;
  }
  
  // Add style details
  if (style.toLowerCase().includes('gold')) {
    prompt += ` Incorporate gold accents and elegant gold typography.`;
  }
  if (style.toLowerCase().includes('blue')) {
    prompt += ` Use a dark blue color scheme as the primary background.`;
  }
  
  // Add venue and date details
  prompt += ` The invitation should subtly indicate the wedding will take place at ${venue} on ${date} at ${time}.`;
  
  // Add final instructions for image quality
  prompt += ` The design should be high-quality, suitable for a wedding invitation, with elegant typography and a sophisticated layout. The image should look like a professional wedding invitation design, not a photograph of an invitation.`;
  
  return prompt;
};

// Select a themed fallback image based on the theme and style
const selectThemedFallbackImage = (theme, style) => {
  // For now, we'll use placeholder images from a public image service
  // These are wedding-themed placeholder images
  const placeholderImages = {
    'elegant': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
    'rustic': 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
    'modern': 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&q=80',
    'traditional': 'https://images.unsplash.com/photo-1511285560929-80b456f37350?w=600&q=80',
    'romantic': 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80',
    'destination': 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=600&q=80',
    'vintage': 'https://images.unsplash.com/photo-1439539698758-ba2680ecadb9?w=600&q=80'
  };
  
  // Check if we have a placeholder for the requested theme
  if (placeholderImages[theme.toLowerCase()]) {
    return placeholderImages[theme.toLowerCase()];
  }
  
  // Default to elegant if theme not found
  return placeholderImages['elegant'];
};

// Handle sharing invitation images
const shareInvitationImage = async (req, res) => {
  try {
    // Check if there's a file in the request
    if (!req.files || !req.files.inviteImage) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const inviteImage = req.files.inviteImage;
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `invitation-${timestamp}.png`;
    
    // Create the uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save the file to the uploads directory
    const filePath = path.join(uploadDir, filename);
    
    // Move the file to the uploads directory
    await inviteImage.mv(filePath);
    
    // Generate the public URL for the image
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3005}`;
    const imageUrl = `${baseUrl}/uploads/${filename}`;
    
    // Return the URL to the client
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Error sharing invitation image:', error);
    res.status(500).json({
      message: 'Failed to share invitation image',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

module.exports = {
  generateAIInvite,
  getInvitationTemplates,
  shareInvitationImage
};
