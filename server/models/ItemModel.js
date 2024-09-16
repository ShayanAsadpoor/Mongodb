const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    image: String,
  }, { collection: 'inventory' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;