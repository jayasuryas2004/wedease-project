const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Import controller
const {
  generateAIInvite,
  getInvitationTemplates,
  shareInvitationImage
} = require('../controllers/inviteController');

// Routes
// Get all available invitation templates
router.get('/templates', getInvitationTemplates);

// Generate invitation based on template
router.post('/generate', optionalAuth, generateAIInvite);

// Share invitation image for WhatsApp and email
router.post('/share-image', shareInvitationImage);

module.exports = router;
