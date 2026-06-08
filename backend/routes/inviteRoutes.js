const express = require('express');
const multer = require('multer');
const path = require('path');
const Invite = require('./models/invite');
const { generateInviteImage } = require('../controllers/dalleController');  // DALL·E Controller

const router = express.Router();

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 👉 Route: Upload manual invite with image
router.post('/create', upload.single('image'), (req, res) => {
  const newInvite = new Invite({
    userId: req.body.userId,
    title: req.body.title,
    imageUrl: req.file ? req.file.path : null,
    message: req.body.message,
  });

  newInvite.save()
    .then(invite => res.json(invite))
    .catch(err => res.status(500).json({ error: err.message }));
});

// 👉 Route: Get all invites
router.get('/', (req, res) => {
  Invite.find()
    .populate('userId', 'username email')
    .then(invites => res.json(invites))
    .catch(err => res.status(500).json({ error: err.message }));
});

// 👉 Route: Generate invite image using DALL·E
router.post('/generate', generateInviteImage);

module.exports = router;
