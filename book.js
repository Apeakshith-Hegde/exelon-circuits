const mongoose = require('mongoose');

// Define the Book schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedYear: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [Number],
});

// Export the Book model
module.exports = mongoose.model('Book', bookSchema);
