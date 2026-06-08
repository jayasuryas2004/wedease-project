const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const inviteRoutes = require('./routes/inviteRoutes');  // Import invite routes

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());  // Enable Cross-Origin Resource Sharing
app.use(express.json());  // Parse incoming JSON requests

app.use('/api/invites', inviteRoutes);  // Use invite routes under '/api/invites'

// Serve uploaded files from 'uploads' folder
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Test route
app.get('/', (req, res) => {
  res.send("Wedease backend running");
});
  
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
