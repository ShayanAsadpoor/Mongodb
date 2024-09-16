const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const aws = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB();

// MongoDB Item Schema and Model
const itemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  image: String,
}, { collection: 'inventory' });
const Item = mongoose.model('Item', itemSchema);

// Multer configuration for file uploads
const storage = multer.memoryStorage(); // Use memory storage for images to be uploaded to S3
const upload = multer({ storage: storage });

// AWS S3 configuration
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new aws.S3();

// Function to upload a file to AWS S3
const uploadFileToS3 = async (file) => {
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // Make the file publicly accessible
  };

  try {
    const { Location } = await s3.upload(uploadParams).promise();
    return Location; // URL of the uploaded file
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error; // It's better to throw an error and catch it in the calling function for custom handling
  }
};

// Endpoint to add a new item
app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      console.log('File received:', req.file.originalname); // Confirm file is received
      imageUrl = await uploadFileToS3(req.file); // Upload image to S3
    }

    const newItem = new Item({
      name: req.body.name,
      quantity: req.body.quantity,
      image: imageUrl,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error in POST /api/items:', error);
    res.status(500).json({ message: 'Failed to add item', error: error.message });
  }
});
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Item.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
    // Consider using a logging framework here for success and error logs
  } catch (error) {
    console.error('Server error deleting item:', error); // Keep error logging
    res.status(500).json({ message: 'Error deleting item' });
  }
});

// Endpoint to fetch all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.put('/api/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, quantity } = req.body;
      const updatedItem = await Item.findByIdAndUpdate(id, { name, quantity }, { new: true });
      if (!updatedItem) throw new Error('Item not found');
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Failed to update item' });
    }
  });
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 
