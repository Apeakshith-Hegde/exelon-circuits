const express = require('express');
const mongoose = require('mongoose');


const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());


mongoose
  .connect('mongodb+srv://test:test@cluster0.inknl.mongodb.net/myDatabase', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.log('Failed to connect to MongoDB:', err));

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedYear: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function (v) {
        const currentYear = new Date().getFullYear();
        return v >= 1950 && v <= currentYear; 
      },
      message: (props) => `${props.value} is not a valid year. Published year must be between 1950 and the current year.`,
    }
  },
  genre: { type: String, required: true, enum: ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Biography'] },
  ratings: {
    type: [Number],
    validate: {
      validator: function (v) {
        
        return v.every(rating => rating >= 1 && rating <= 5);
      },
      message: 'Ratings must be between 1 and 5.'
    }
  },
  averageRating: { type: Number, default: 0 }
});


const Book = mongoose.model('Book', bookSchema);

app.post('/books', async (req, res) => {
  const { title, author, publishedYear, genre, ratings } = req.body;

 
  if (!title || !author || !publishedYear || !genre) {
    return res.status(400).send('All fields are required except ratings.');
  }


  let averageRating = 0;
  if (ratings && ratings.length > 0) {
    averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  const book = new Book({ title, author, publishedYear, genre, ratings, averageRating });

  try {
    const savedBook = await book.save();
    res.status(201).send(savedBook);
  } catch (err) {
    console.error('Error saving book:', err); // Log the error
    res.status(500).send(`Something went wrong: ${err.message}`); // Return detailed error message
  }
});


app.get('/books', async (req, res) => {
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
    res.status(500).send(`Something went wrong: ${err.message}`);
  }
});


app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send('Book not found.');
    res.send(book);
  } catch (err) {
    res.status(400).send('Invalid ID.');
  }
});


app.put('/books/:id', async (req, res) => {
  const { title, author, publishedYear, genre, ratings } = req.body;

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send('Book not found.');

    if (title) book.title = title;
    if (author) book.author = author;
    if (publishedYear) book.publishedYear = publishedYear;
    if (genre) book.genre = genre;
    if (ratings) book.ratings = ratings;

    
    if (ratings && ratings.length > 0) {
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      book.averageRating = averageRating;
    }

    const updatedBook = await book.save();
    res.send(updatedBook);
  } catch (err) {
    res.status(500).send(`Something went wrong: ${err.message}`);
  }
});


app.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send('Book not found.');
    res.send(book);
  } catch (err) {
    res.status(400).send('Invalid ID.');
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});