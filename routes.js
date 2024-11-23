const express = require('express');
const Book = require('../models/book');
const router = express.Router();

// Add a new book
router.post('/', async (req, res) => {
  const { title, author, publishedYear, genre, ratings } = req.body;

  // Validate required fields
  if (!title || !author || !publishedYear || !genre) {
    return res.status(400).send('All fields are required except ratings.');
  }

  // Validate ratings
  if (ratings && !ratings.every((rating) => rating >= 1 && rating <= 5)) {
    return res.status(400).send('Ratings must be numbers between 1 and 5.');
  }

  const book = new Book({ title, author, publishedYear, genre, ratings });

  try {
    const savedBook = await book.save();
    res.status(201).send(savedBook);
  } catch (err) {
    res.status(500).send('Something went wrong.');
  }
});

// Get all books with optional filters
router.get('/', async (req, res) => {
  const { author, genre, publishedYear, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (author) filter.author = author;
  if (genre) filter.genre = genre;
  if (publishedYear) filter.publishedYear = Number(publishedYear);

  try {
    const books = await Book.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const totalBooks = await Book.countDocuments(filter);

    res.send({ totalBooks, books });
  } catch (err) {
    res.status(500).send('Something went wrong.');
  }
});

// Get a book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send('Book not found.');
    res.send(book);
  } catch (err) {
    res.status(400).send('Invalid ID.');
  }
});

// Update a book by ID
router.put('/:id', async (req, res) => {
  const { title, author, publishedYear, genre, ratings } = req.body;

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send('Book not found.');

    if (title) book.title = title;
    if (author) book.author = author;
    if (publishedYear) book.publishedYear = publishedYear;
    if (genre) book.genre = genre;
    if (ratings) book.ratings = ratings;

    const updatedBook = await book.save();
    res.send(updatedBook);
  } catch (err) {
    res.status(500).send('Something went wrong.');
  }
});

// Delete a book by ID
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send('Book not found.');
    res.send(book);
  } catch (err) {
    res.status(400).send('Invalid ID.');
  }
});

module.exports = router;
