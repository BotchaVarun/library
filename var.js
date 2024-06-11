const express = require("express");
const bodyparser = require('body-parser');
const mongoose = require("mongoose");
const cors = require('cors');

const app = express();

// Set up CORS options
const corsOptions = {
  origin: 'http://127.0.0.1:5500', // Allow requests from this origin
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Use CORS middleware with the defined options
app.use(express.json());

app.get("/add", (req, res) => {
  return res.send("<h1>Hello</h1>");
});

const server = '127.0.0.1:27017'; 
const database = 'main'; 
class Database {
  constructor() {
    this._connect();
  }
  _connect() {
    mongoose
      .connect(`mongodb://${server}/${database}`)
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err) => {
        console.error('Database connection failed');
      });
  }
}
const dbInstance = new Database();

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
const bookSchema = new mongoose.Schema({
  name: String,
  price: String,
  status: String
});
const User = mongoose.model("User", userSchema);
const Book = mongoose.model("Book", bookSchema);
var jsonparser = bodyparser.json();

app.post("/signup", jsonparser, (req, res) => {
  console.log(req.body);
  const newUser = new User({
    email: req.body.email,
    password: req.body.password
  });
  newUser.save()
    .then(() => {
      console.log("Saved user to MongoDB");
    })
    .catch((error) => {
      console.error(error);
    });

  console.log("New user created: ", newUser);
  res.send("The data has been received");
});

app.post('/signin', bodyparser.json(), (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  User.findOne({ email, password })
    .then(user => {
      if (user) {
        console.log("login successfully");
        res.status(200).send("Sign-in successful");
      } else {
        res.status(401).send("Invalid credentials");
        console.log("Invalid credentials");
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Error during sign-in");
    });
});

app.post('/addbook', bodyparser.json(), (req, res) => {
  const newBook = new Book({
    id: req.body.id,
    name: req.body.name,
    price: req.body.price,
    status: req.body.status
  });
  newBook.save()
    .then(() => {
      console.log("Saved book to MongoDB");
    })
    .catch((error) => {
      console.error(error);
    });

  console.log("New book created: ", newBook);
  res.send("The data has been received");
});

app.post('/remove', bodyparser.json(), (req, res) => {
  Book.findOne({ name: req.body.name })
    .then((book) => {
      if (!book) {
        return res.status(404).send("Book not found");
      }
      return Book.deleteOne({ name: req.body.name });
    })
    .then(() => {
      res.status(200).send("Book deleted successfully");
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        res.status(500).send("Error deleting book");
      }
    });
});

app.post('/taken', bodyparser.json(), (req, res) => {
  Book.findOne({ name: req.body.name })
    .then((book) => {
      if (!book) {
        return res.status(404).send("Book not found");
      }
      if (book.status === "available") {
        return Book.updateOne({ name: req.body.name }, { $set: { status: "taken" } })
          .then(() => {
            res.status(200).send("Book is taken");
          });
      } else {
        res.status(409).send("Book is already taken"); // 409 Conflict is a more appropriate status code
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error while taking book");
    });
});

// Endpoint to get all books
app.get('/books', (req, res) => {
  Book.find({ status: 'available' }) // Add a query to filter available books
    .then(books => res.status(200).json(books))
    .catch(error => res.status(500).send("Error fetching books"));
});
app.get('/takenbooks', (req, res) => {
  Book.find({ status: 'taken' }) // Add a query to filter available books
    .then(books => res.status(200).json(books))
    .catch(error => res.status(500).send("Error fetching books"));
});
// Endpoint to add a new book
app.post('/books', bodyparser.json(), (req, res) => {
  const newBook = new Book({ name: req.body.name, status: req.body.status || 'available' });
  newBook.save()
    .then(() => res.status(201).send("Book added successfully"))
    .catch(error => res.status(500).send("Error adding book"));
});

// PUT route to update book status
app.put('/books/:id', bodyparser.json(), (req, res) => {
  const bookId = req.params.id;
  console.log(bookId)
  const newStatus = req.body.status;

  Book.findByIdAndUpdate(bookId, { status: newStatus }, { new: true })
    .then(updatedBook => {
      if (!updatedBook) {
        return res.status(404).json({ error: 'Book not found' });
      }
      res.status(200).json({ message: 'Book status updated successfully', updatedBook });
    })
    .catch(error => {
      console.error('Error updating book status:', error);
      res.status(500).json({ error: 'Error updating book status' });
    });
});

app.listen(3002, () => {
  console.log("The server is active on port 3002");
});

module.exports = dbInstance;
