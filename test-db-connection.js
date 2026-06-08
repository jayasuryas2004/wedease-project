const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');

// Load environment variables
dotenv.config();

// Get the MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Function to check if MongoDB is running locally
function checkLocalMongoDB() {
  return new Promise((resolve) => {
    // Different commands based on OS
    const cmd = process.platform === 'win32' 
      ? 'tasklist /FI "IMAGENAME eq mongod.exe"' 
      : 'ps aux | grep mongod';
    
    exec(cmd, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      
      // Check if mongod is in the output and not just in the grep command itself
      const isRunning = process.platform === 'win32'
        ? stdout.toLowerCase().includes('mongod.exe')
        : stdout.toLowerCase().includes('mongod') && !stdout.toLowerCase().includes('grep mongod');
      
      resolve(isRunning);
    });
  });
}

// Function to test database connection
async function testConnection() {
  console.log('\n📊 Testing MongoDB connection...\n');
  
  // Check if we're using a local connection
  const isLocalConnection = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
  
  if (isLocalConnection) {
    console.log('🔍 Using local MongoDB connection:', mongoURI);
    
    // Check if local MongoDB is running
    const isMongoDBRunning = await checkLocalMongoDB();
    if (!isMongoDBRunning) {
      console.error('\n❌ Local MongoDB is not running!');
      console.error('\nPlease start MongoDB on your local machine:');
      console.error('- Windows: Start MongoDB service or run mongod.exe');
      console.error('- Mac/Linux: Run sudo service mongod start or mongod');
      console.error('\nAlternatively, use MongoDB Atlas for cloud hosting.\n');
      return;
    }
  } else {
    // For Atlas, just show a masked connection string
    console.log('🔍 Using MongoDB Atlas connection:', 
      mongoURI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://******:******@'));
  }
  
  try {
    // Attempt to connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5s
    });
    
    console.log('\n✅ MongoDB connection successful!');
    
    // Create a simple test document
    const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
      name: String,
      testDate: { type: Date, default: Date.now }
    }));
    
    // Save a test document
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Successfully created test document');
    
    // Find the test document
    const foundDoc = await TestModel.findOne({ name: 'Connection Test' });
    console.log(`✅ Successfully retrieved test document: ${foundDoc.name}, created at ${foundDoc.testDate}`);
    
    // Clean up - delete the test document and collection
    await TestModel.deleteMany({});
    console.log('✅ Test cleanup complete');
    
    console.log('\n🎉 Your MongoDB connection is working perfectly! You can now run your Wedease application.\n');
    console.log('To start the server, run: npm start');
  } catch (error) {
    console.error('\n❌ MongoDB connection error:', error.message);
    
    if (isLocalConnection) {
      console.error('\nPossible issues with local MongoDB:');
      console.error('1. Check if MongoDB is installed and running');
      console.error('2. Verify the port number (default is 27017)');
      console.error('3. Ensure no firewall is blocking the connection');
      console.error('\nTo use MongoDB Atlas instead:');
      console.error('1. Update your .env file with your Atlas connection string');
      console.error('2. Uncomment the MONGODB_URI line for Atlas and comment out the local one');
    } else {
      console.error('\nPossible issues with MongoDB Atlas:');
      console.error('1. Check if your username and password are correct');
      console.error('2. Verify that your IP address is whitelisted in MongoDB Atlas Network Access');
      console.error('3. Ensure your cluster is running and accessible');
      console.error('4. Check if the database name in the connection string is correct');
    }
  } finally {
    // Close the connection if it was established
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('\nConnection closed');
    }
  }
}

// Run the test
testConnection();
