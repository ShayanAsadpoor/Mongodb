const mongoose = require('mongoose');
require('dotenv').config(); // Make sure you have dotenv installed and setup for environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.REACT_APP_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
